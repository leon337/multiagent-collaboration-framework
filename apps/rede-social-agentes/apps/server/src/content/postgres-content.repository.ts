import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { ContentStatus, PermissionScope } from '@rsa/contracts';
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
  community_id: string | null;
  body: string;
  status: ContentStatus;
  created_at: Date;
  published_at: Date | null;
  archived_at: Date | null;
}

const returningContentColumns = `
  "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
  "community_id", "body", "status", "created_at", "published_at", "archived_at"
`;

const selectedContentColumns = `
  sc."id", sc."author_agent_id", sc."responsible_account_id", sc."approved_by_account_id",
  sc."community_id", sc."body", sc."status", sc."created_at", sc."published_at",
  sc."archived_at"
`;

function mapContent(row: SocialContentRow): SocialContentRecord {
  return {
    id: row.id,
    authorAgentId: row.author_agent_id,
    responsibleAccountId: row.responsible_account_id,
    approvedByAccountId: row.approved_by_account_id,
    communityId: row.community_id,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
  };
}

function communityIdFromScope(scope: PermissionScope | null): string | null {
  return scope?.resourceType === 'community' ? scope.resourceId : null;
}

async function ensureCommunityMemberships(
  client: DatabaseTransaction,
  input: {
    communityId: string;
    agentId: string;
    responsibleAccountId: string;
  },
): Promise<void> {
  const result = await client.query(
    `
      select c."id"
      from "communities" c
      join "community_members" agent_member
        on agent_member."community_id" = c."id"
       and agent_member."subject_type" = 'AGENT'
       and agent_member."agent_id" = $2
       and agent_member."responsible_account_id" = $3
       and agent_member."status" = 'ACTIVE'
      join "community_members" human_member
        on human_member."community_id" = c."id"
       and human_member."subject_type" = 'HUMAN'
       and human_member."account_id" = $3
       and human_member."status" = 'ACTIVE'
      where c."id" = $1 and c."status" = 'ACTIVE'
      limit 1
    `,
    [input.communityId, input.agentId, input.responsibleAccountId],
  );

  if (result.rowCount !== 1) {
    throw new ContentResourceAccessDeniedError();
  }
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
      const communityId = communityIdFromScope(input.scope);
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

      if (communityId) {
        await ensureCommunityMemberships(client, {
          communityId,
          agentId: input.agentId,
          responsibleAccountId: input.responsibleAccountId,
        });
      }

      const result = await client.query<SocialContentRow>(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "community_id", "body"
          ) values ($1, $2, $3, $4, $5)
          returning ${returningContentColumns}
        `,
        [input.id, input.agentId, input.responsibleAccountId, communityId, input.body],
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
          communityId,
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

      if (current.community_id) {
        await ensureCommunityMemberships(client, {
          communityId: current.community_id,
          agentId: current.author_agent_id,
          responsibleAccountId: input.responsibleAccountId,
        });
      }

      const result = await client.query<SocialContentRow>(
        `
          update "social_content"
          set "status" = 'PUBLISHED',
              "approved_by_account_id" = $2,
              "published_at" = now(),
              "updated_at" = now()
          where "id" = $1
          returning ${returningContentColumns}
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
        payload: { authorAgentId: row.author_agent_id, communityId: row.community_id },
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
          returning ${returningContentColumns}
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
        payload: {
          previousStatus: current.status,
          authorAgentId: row.author_agent_id,
          communityId: row.community_id,
        },
      });

      return mapContent(row);
    });
  }

  async get(input: GetContentInput): Promise<SocialContentRecord> {
    const result = await this.database.query<SocialContentRow>(
      `
        select ${selectedContentColumns}
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
        select ${selectedContentColumns}
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
