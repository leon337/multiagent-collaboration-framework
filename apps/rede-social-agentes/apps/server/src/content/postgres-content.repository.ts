import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { ContentStatus } from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import { evaluatePermissionWithClient } from '../permissions/permission-evaluator.js';
import {
  ContentPermissionDeniedError,
  ContentResourceAccessDeniedError,
  ContentStateConflictError,
} from './content.errors.js';
import type {
  ArchiveContentInput,
  ContentRepository,
  CreateDraftInput,
  GetContentInput,
  PublishContentInput,
  SocialContentRecord,
} from './content.repository.js';

interface SocialContentRow extends DatabaseRow {
  id: string;
  author_agent_id: string;
  responsible_account_id: string;
  approved_by_account_id: string | null;
  body: string;
  status: ContentStatus;
  created_at: Date;
  published_at: Date | null;
  archived_at: Date | null;
}

const contentColumns = `
  "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
  "body", "status", "created_at", "published_at", "archived_at"
`;

function mapContent(row: SocialContentRow): SocialContentRecord {
  return {
    id: row.id,
    authorAgentId: row.author_agent_id,
    responsibleAccountId: row.responsible_account_id,
    approvedByAccountId: row.approved_by_account_id,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
  };
}

async function writeContentAudit(
  client: DatabaseTransaction,
  input: {
    actorId: string;
    actorType: 'AGENT' | 'HUMAN';
    eventType: string;
    contentId: string;
    correlationId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `
      insert into "audit_events" (
        "id", "actor_id", "actor_type", "event_type", "aggregate_type",
        "aggregate_id", "correlation_id", "payload"
      ) values ($1, $2, $3, $4, 'SOCIAL_CONTENT', $5, $6, $7::jsonb)
    `,
    [
      randomUUID(),
      input.actorId,
      input.actorType,
      input.eventType,
      input.contentId,
      input.correlationId,
      JSON.stringify(input.payload),
    ],
  );
}

@Injectable()
export class PostgresContentRepository implements ContentRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async createDraft(input: CreateDraftInput): Promise<SocialContentRecord> {
    return this.database.transaction(async (client) => {
      const decision = await evaluatePermissionWithClient(client, {
        agentId: input.agentId,
        responsibleAccountId: input.responsibleAccountId,
        permission: 'content.draft.create',
        scope: input.scope,
        correlationId: input.correlationId,
      });

      if (!decision.allowed) {
        throw new ContentPermissionDeniedError(decision.reason);
      }

      const result = await client.query<SocialContentRow>(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "body"
          ) values ($1, $2, $3, $4)
          returning ${contentColumns}
        `,
        [input.id, input.agentId, input.responsibleAccountId, input.body],
      );

      const row = result.rows[0];
      if (!row) {
        throw new Error('Content draft creation did not return a record.');
      }

      await writeContentAudit(client, {
        actorId: input.agentId,
        actorType: 'AGENT',
        eventType: 'CONTENT_DRAFT_CREATED',
        contentId: input.id,
        correlationId: input.correlationId,
        payload: {
          responsibleAccountId: input.responsibleAccountId,
          permissionGrantId: decision.grantId,
          scope: input.scope,
        },
      });

      return mapContent(row);
    });
  }

  async publish(input: PublishContentInput): Promise<SocialContentRecord> {
    return this.database.transaction(async (client) => {
      const current = await this.findOwnedForUpdate(
        client,
        input.contentId,
        input.responsibleAccountId,
      );

      if (current.status !== 'DRAFT') {
        throw new ContentStateConflictError();
      }

      const result = await client.query<SocialContentRow>(
        `
          update "social_content"
          set "status" = 'PUBLISHED',
              "approved_by_account_id" = $2,
              "published_at" = now(),
              "updated_at" = now()
          where "id" = $1
          returning ${contentColumns}
        `,
        [input.contentId, input.responsibleAccountId],
      );

      const row = result.rows[0];
      if (!row) {
        throw new Error('Content publication did not return a record.');
      }

      await writeContentAudit(client, {
        actorId: input.responsibleAccountId,
        actorType: 'HUMAN',
        eventType: 'CONTENT_PUBLISHED',
        contentId: input.contentId,
        correlationId: input.correlationId,
        payload: { authorAgentId: row.author_agent_id },
      });

      return mapContent(row);
    });
  }

  async archive(input: ArchiveContentInput): Promise<SocialContentRecord> {
    return this.database.transaction(async (client) => {
      const current = await this.findOwnedForUpdate(
        client,
        input.contentId,
        input.responsibleAccountId,
      );

      if (current.status === 'ARCHIVED') {
        throw new ContentStateConflictError();
      }

      const result = await client.query<SocialContentRow>(
        `
          update "social_content"
          set "status" = 'ARCHIVED', "archived_at" = now(), "updated_at" = now()
          where "id" = $1
          returning ${contentColumns}
        `,
        [input.contentId],
      );

      const row = result.rows[0];
      if (!row) {
        throw new Error('Content archival did not return a record.');
      }

      await writeContentAudit(client, {
        actorId: input.responsibleAccountId,
        actorType: 'HUMAN',
        eventType: 'CONTENT_ARCHIVED',
        contentId: input.contentId,
        correlationId: input.correlationId,
        payload: { previousStatus: current.status, authorAgentId: row.author_agent_id },
      });

      return mapContent(row);
    });
  }

  async get(input: GetContentInput): Promise<SocialContentRecord> {
    const result = await this.database.query<SocialContentRow>(
      `
        select ${contentColumns}
        from "social_content" sc
        join "responsibility_links" rl
          on rl."agent_id" = sc."author_agent_id"
         and rl."responsible_account_id" = $2
         and rl."status" = 'ACTIVE'
        where sc."id" = $1
        limit 1
      `,
      [input.contentId, input.responsibleAccountId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new ContentResourceAccessDeniedError();
    }

    return mapContent(row);
  }

  private async findOwnedForUpdate(
    client: DatabaseTransaction,
    contentId: string,
    responsibleAccountId: string,
  ): Promise<SocialContentRow> {
    const result = await client.query<SocialContentRow>(
      `
        select ${contentColumns}
        from "social_content" sc
        join "responsibility_links" rl
          on rl."agent_id" = sc."author_agent_id"
         and rl."responsible_account_id" = $2
         and rl."status" = 'ACTIVE'
        where sc."id" = $1
        limit 1
        for update of sc
      `,
      [contentId, responsibleAccountId],
    );

    const row = result.rows[0];
    if (!row) {
      throw new ContentResourceAccessDeniedError();
    }

    return row;
  }
}
