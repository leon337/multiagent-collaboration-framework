import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CommentAuthorType,
  CommentStatus,
  PermissionDecisionReason,
  ReactionType,
} from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import { evaluatePermissionWithClient } from '../permissions/permission-evaluator.js';
import {
  InteractionPermissionDeniedError,
  InteractionResourceNotAvailableError,
  InteractionStateConflictError,
} from './interaction.errors.js';
import type {
  CommentPageRecord,
  CommentRecord,
  InteractionRepository,
  ReactionRecord,
} from './interaction.repository.js';

interface CommentRow extends DatabaseRow {
  id: string;
  content_id: string;
  author_type: CommentAuthorType;
  author_account_id: string | null;
  author_agent_id: string | null;
  responsible_account_id: string | null;
  approved_by_account_id: string | null;
  body: string;
  status: CommentStatus;
  created_at: Date;
  published_at: Date | null;
  archived_at: Date | null;
}

interface ReactionRow extends DatabaseRow {
  content_id: string;
  account_id: string;
  reaction_type: ReactionType;
  updated_at: Date;
}

function mapComment(row: CommentRow): CommentRecord {
  return {
    id: row.id,
    contentId: row.content_id,
    authorType: row.author_type,
    authorAccountId: row.author_account_id,
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

async function ensurePublishedContent(
  client: DatabaseTransaction,
  contentId: string,
): Promise<void> {
  const content = await client.query(
    `
      select "id"
      from "social_content"
      where "id" = $1 and "status" = 'PUBLISHED'
      limit 1
    `,
    [contentId],
  );
  if (content.rowCount !== 1) {
    throw new InteractionResourceNotAvailableError();
  }
}

async function writeAudit(
  client: DatabaseTransaction,
  input: {
    actorId: string;
    actorType: 'HUMAN' | 'AGENT';
    eventType: string;
    aggregateType: 'COMMENT' | 'CONTENT';
    aggregateId: string;
    correlationId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `
      insert into "audit_events" (
        "id", "actor_id", "actor_type", "event_type", "aggregate_type",
        "aggregate_id", "correlation_id", "payload"
      ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [
      randomUUID(),
      input.actorId,
      input.actorType,
      input.eventType,
      input.aggregateType,
      input.aggregateId,
      input.correlationId,
      JSON.stringify(input.payload),
    ],
  );
}

const commentColumns = `
  "id", "content_id", "author_type", "author_account_id", "author_agent_id",
  "responsible_account_id", "approved_by_account_id", "body", "status",
  "created_at", "published_at", "archived_at"
`;

@Injectable()
export class PostgresInteractionRepository implements InteractionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async createHumanComment(input: {
    id: string;
    contentId: string;
    accountId: string;
    body: string;
    correlationId: string;
  }): Promise<CommentRecord> {
    return this.database.transaction(async (client) => {
      await ensurePublishedContent(client, input.contentId);
      const result = await client.query<CommentRow>(
        `
          insert into "social_comments" (
            "id", "content_id", "author_type", "author_account_id",
            "approved_by_account_id", "body", "status", "published_at"
          ) values ($1, $2, 'HUMAN', $3, $3, $4, 'PUBLISHED', now())
          returning ${commentColumns}
        `,
        [input.id, input.contentId, input.accountId, input.body],
      );
      const row = result.rows[0];
      if (!row) {
        throw new InteractionStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.accountId,
        actorType: 'HUMAN',
        eventType: 'HUMAN_COMMENT_PUBLISHED',
        aggregateType: 'COMMENT',
        aggregateId: input.id,
        correlationId: input.correlationId,
        payload: { contentId: input.contentId },
      });
      return mapComment(row);
    });
  }

  async createAgentCommentDraft(input: {
    id: string;
    contentId: string;
    agentId: string;
    responsibleAccountId: string;
    body: string;
    correlationId: string;
  }): Promise<CommentRecord> {
    return this.database.transaction(async (client) => {
      await ensurePublishedContent(client, input.contentId);
      const decision = await evaluatePermissionWithClient(client, {
        agentId: input.agentId,
        responsibleAccountId: input.responsibleAccountId,
        permission: 'content.comment.draft.create',
        scope: { resourceType: 'content', resourceId: input.contentId },
        correlationId: input.correlationId,
      });
      if (!decision.allowed) {
        throw new InteractionPermissionDeniedError(
          decision.reason as Exclude<PermissionDecisionReason, 'ALLOWED'>,
        );
      }

      const result = await client.query<CommentRow>(
        `
          insert into "social_comments" (
            "id", "content_id", "author_type", "author_agent_id",
            "responsible_account_id", "body", "status"
          ) values ($1, $2, 'AGENT', $3, $4, $5, 'DRAFT')
          returning ${commentColumns}
        `,
        [input.id, input.contentId, input.agentId, input.responsibleAccountId, input.body],
      );
      const row = result.rows[0];
      if (!row) {
        throw new InteractionStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.agentId,
        actorType: 'AGENT',
        eventType: 'AGENT_COMMENT_DRAFT_CREATED',
        aggregateType: 'COMMENT',
        aggregateId: input.id,
        correlationId: input.correlationId,
        payload: {
          contentId: input.contentId,
          responsibleAccountId: input.responsibleAccountId,
          grantId: decision.grantId,
        },
      });
      return mapComment(row);
    });
  }

  async publishComment(input: {
    commentId: string;
    responsibleAccountId: string;
    correlationId: string;
  }): Promise<CommentRecord> {
    return this.database.transaction(async (client) => {
      const current = await client.query<CommentRow>(
        `select ${commentColumns} from "social_comments" where "id" = $1 for update`,
        [input.commentId],
      );
      const comment = current.rows[0];
      if (
        !comment ||
        comment.author_type !== 'AGENT' ||
        comment.responsible_account_id !== input.responsibleAccountId
      ) {
        throw new InteractionResourceNotAvailableError();
      }
      await ensurePublishedContent(client, comment.content_id);
      if (comment.status !== 'DRAFT') {
        throw new InteractionStateConflictError();
      }

      const result = await client.query<CommentRow>(
        `
          update "social_comments"
          set "status" = 'PUBLISHED', "approved_by_account_id" = $2,
              "published_at" = now(), "updated_at" = now()
          where "id" = $1
          returning ${commentColumns}
        `,
        [input.commentId, input.responsibleAccountId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new InteractionStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.responsibleAccountId,
        actorType: 'HUMAN',
        eventType: 'AGENT_COMMENT_PUBLISHED',
        aggregateType: 'COMMENT',
        aggregateId: input.commentId,
        correlationId: input.correlationId,
        payload: { contentId: comment.content_id, authorAgentId: comment.author_agent_id },
      });
      return mapComment(row);
    });
  }

  async archiveComment(input: {
    commentId: string;
    accountId: string;
    correlationId: string;
  }): Promise<CommentRecord> {
    return this.database.transaction(async (client) => {
      const current = await client.query<CommentRow>(
        `select ${commentColumns} from "social_comments" where "id" = $1 for update`,
        [input.commentId],
      );
      const comment = current.rows[0];
      const authorized =
        comment?.author_type === 'HUMAN'
          ? comment.author_account_id === input.accountId
          : comment?.responsible_account_id === input.accountId;
      if (!comment || !authorized) {
        throw new InteractionResourceNotAvailableError();
      }
      if (comment.status === 'ARCHIVED') {
        return mapComment(comment);
      }

      const result = await client.query<CommentRow>(
        `
          update "social_comments"
          set "status" = 'ARCHIVED', "archived_at" = now(), "updated_at" = now()
          where "id" = $1
          returning ${commentColumns}
        `,
        [input.commentId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new InteractionStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.accountId,
        actorType: 'HUMAN',
        eventType: 'COMMENT_ARCHIVED',
        aggregateType: 'COMMENT',
        aggregateId: input.commentId,
        correlationId: input.correlationId,
        payload: { contentId: comment.content_id, authorType: comment.author_type },
      });
      return mapComment(row);
    });
  }

  async listComments(input: {
    contentId: string;
    limit: number;
    cursor: { publishedAt: Date; id: string } | null;
  }): Promise<CommentPageRecord> {
    return this.database.transaction(async (client) => {
      await ensurePublishedContent(client, input.contentId);
      const values: unknown[] = [input.contentId, input.limit + 1];
      let cursorCondition = '';
      if (input.cursor) {
        values.push(input.cursor.publishedAt, input.cursor.id);
        cursorCondition = `and ("published_at", "id") > ($3::timestamptz, $4::text)`;
      }
      const result = await client.query<CommentRow>(
        `
          select ${commentColumns}
          from "social_comments"
          where "content_id" = $1 and "status" = 'PUBLISHED'
          ${cursorCondition}
          order by "published_at" asc, "id" asc
          limit $2
        `,
        values,
      );
      return {
        items: result.rows.slice(0, input.limit).map(mapComment),
        hasMore: result.rows.length > input.limit,
      };
    });
  }

  async setReaction(input: {
    contentId: string;
    accountId: string;
    reactionType: ReactionType;
    correlationId: string;
  }): Promise<ReactionRecord> {
    return this.database.transaction(async (client) => {
      await ensurePublishedContent(client, input.contentId);
      const result = await client.query<ReactionRow>(
        `
          insert into "social_reactions" ("content_id", "account_id", "reaction_type")
          values ($1, $2, $3)
          on conflict ("content_id", "account_id", "reaction_type")
          do update set "updated_at" = now()
          returning "content_id", "account_id", "reaction_type", "updated_at"
        `,
        [input.contentId, input.accountId, input.reactionType],
      );
      const row = result.rows[0];
      if (!row) {
        throw new InteractionStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.accountId,
        actorType: 'HUMAN',
        eventType: 'REACTION_SET',
        aggregateType: 'CONTENT',
        aggregateId: input.contentId,
        correlationId: input.correlationId,
        payload: { reactionType: input.reactionType },
      });
      return {
        contentId: row.content_id,
        accountId: row.account_id,
        reactionType: row.reaction_type,
        active: true,
        updatedAt: row.updated_at,
      };
    });
  }

  async removeReaction(input: {
    contentId: string;
    accountId: string;
    reactionType: ReactionType;
    correlationId: string;
  }): Promise<ReactionRecord> {
    return this.database.transaction(async (client) => {
      await ensurePublishedContent(client, input.contentId);
      const updatedAt = new Date();
      await client.query(
        `
          delete from "social_reactions"
          where "content_id" = $1 and "account_id" = $2 and "reaction_type" = $3
        `,
        [input.contentId, input.accountId, input.reactionType],
      );
      await writeAudit(client, {
        actorId: input.accountId,
        actorType: 'HUMAN',
        eventType: 'REACTION_REMOVED',
        aggregateType: 'CONTENT',
        aggregateId: input.contentId,
        correlationId: input.correlationId,
        payload: { reactionType: input.reactionType },
      });
      return {
        contentId: input.contentId,
        accountId: input.accountId,
        reactionType: input.reactionType,
        active: false,
        updatedAt,
      };
    });
  }
}
