import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import { PostgresPermissionRepository } from '../permissions/postgres-permission.repository.js';
import {
  InteractionPermissionDeniedError,
  InteractionResourceNotAvailableError,
} from './interaction.errors.js';
import { InteractionService } from './interaction.service.js';
import { PostgresInteractionRepository } from './postgres-interaction.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

interface QuotaRow extends DatabaseRow {
  quota_used: number;
}

describe('PostgresInteractionRepository integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('supervises agent comments and keeps reactions idempotent', async () => {
    const identities = new PostgresIdentityRepository(database);
    const agents = new PostgresAgentRepository(database);
    const permissions = new PostgresPermissionRepository(database);
    const interactions = new InteractionService(new PostgresInteractionRepository(database));
    const responsibleAccountId = randomUUID();
    const unrelatedAccountId = randomUUID();
    const agentId = randomUUID();
    const contentId = randomUUID();
    const hiddenContentId = randomUUID();
    const grantId = randomUUID();
    const correlation = randomUUID();

    try {
      await identities.createHumanAccount({
        id: responsibleAccountId,
        email: `interaction-responsible-${responsibleAccountId}@example.test`,
        displayName: 'Interaction Responsible',
        passwordHash: 'scrypt$integration$responsible',
        correlationId: `account-${correlation}`,
      });
      await identities.createHumanAccount({
        id: unrelatedAccountId,
        email: `interaction-unrelated-${unrelatedAccountId}@example.test`,
        displayName: 'Interaction Unrelated',
        passwordHash: 'scrypt$integration$unrelated',
        correlationId: `unrelated-${correlation}`,
      });
      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId: randomUUID(),
        responsibleAccountId,
        handle: `interaction_${agentId.replaceAll('-', '').slice(0, 18)}`,
        displayName: 'Interaction Agent',
        bio: null,
        capabilities: ['commenting'],
        correlationId: `agent-${correlation}`,
      });
      await agents.transitionAgentState({
        agentId,
        responsibleAccountId,
        targetStatus: 'ACTIVE',
        correlationId: `activate-${correlation}`,
      });

      await database.query(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
            "body", "status", "published_at"
          ) values ($1, $2, $3, $3, 'Published target', 'PUBLISHED', now())
        `,
        [contentId, agentId, responsibleAccountId],
      );
      await database.query(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "body", "status"
          ) values ($1, $2, $3, 'Hidden target', 'DRAFT')
        `,
        [hiddenContentId, agentId, responsibleAccountId],
      );

      await expect(
        interactions.createAgentCommentDraft(
          agentId,
          contentId,
          { body: 'Draft without grant' },
          responsibleAccountId,
          `denied-${correlation}`,
        ),
      ).rejects.toBeInstanceOf(InteractionPermissionDeniedError);

      await permissions.grantPermission({
        id: grantId,
        agentId,
        responsibleAccountId,
        permission: 'content.comment.draft.create',
        scope: { resourceType: 'content', resourceId: contentId },
        quotaLimit: 1,
        validUntil: new Date(Date.now() + 60 * 60 * 1000),
        correlationId: `grant-${correlation}`,
      });

      const humanComment = await interactions.createHumanComment(
        contentId,
        { body: 'Human comment' },
        unrelatedAccountId,
        `human-${correlation}`,
      );
      expect(humanComment).toMatchObject({
        authorType: 'HUMAN',
        authorAccountId: unrelatedAccountId,
        status: 'PUBLISHED',
      });

      const draft = await interactions.createAgentCommentDraft(
        agentId,
        contentId,
        { body: 'Agent comment draft' },
        responsibleAccountId,
        `draft-${correlation}`,
      );
      expect(draft).toMatchObject({
        authorType: 'AGENT',
        authorAgentId: agentId,
        approvedByAccountId: null,
        status: 'DRAFT',
      });

      await expect(
        interactions.publishComment(draft.id, unrelatedAccountId, `third-party-${correlation}`),
      ).rejects.toBeInstanceOf(InteractionResourceNotAvailableError);

      const published = await interactions.publishComment(
        draft.id,
        responsibleAccountId,
        `publish-${correlation}`,
      );
      expect(published).toMatchObject({
        status: 'PUBLISHED',
        authorAgentId: agentId,
        approvedByAccountId: responsibleAccountId,
      });

      const quota = await database.query<QuotaRow>(
        'select "quota_used" from "permission_grants" where "id" = $1',
        [grantId],
      );
      expect(quota.rows[0]?.quota_used).toBe(1);

      const firstPage = await interactions.listComments(contentId, 1);
      const secondPage = await interactions.listComments(
        contentId,
        1,
        firstPage.nextCursor ?? undefined,
      );
      const listedIds = [...firstPage.items, ...secondPage.items].map((comment) => comment.id);
      expect(new Set(listedIds).size).toBe(2);
      expect(listedIds).toEqual(expect.arrayContaining([humanComment.id, published.id]));

      await expect(
        interactions.createHumanComment(
          hiddenContentId,
          { body: 'Must stay hidden' },
          unrelatedAccountId,
          `hidden-${correlation}`,
        ),
      ).rejects.toBeInstanceOf(InteractionResourceNotAvailableError);

      await interactions.setReaction(
        contentId,
        unrelatedAccountId,
        'INSIGHTFUL',
        `reaction-one-${correlation}`,
      );
      await interactions.setReaction(
        contentId,
        unrelatedAccountId,
        'INSIGHTFUL',
        `reaction-two-${correlation}`,
      );
      const activeReactionCount = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "social_reactions"
          where "content_id" = $1 and "account_id" = $2 and "reaction_type" = 'INSIGHTFUL'
        `,
        [contentId, unrelatedAccountId],
      );
      expect(Number(activeReactionCount.rows[0]?.count ?? '0')).toBe(1);

      await interactions.removeReaction(
        contentId,
        unrelatedAccountId,
        'INSIGHTFUL',
        `remove-one-${correlation}`,
      );
      await interactions.removeReaction(
        contentId,
        unrelatedAccountId,
        'INSIGHTFUL',
        `remove-two-${correlation}`,
      );
      const removedReactionCount = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "social_reactions"
          where "content_id" = $1 and "account_id" = $2
        `,
        [contentId, unrelatedAccountId],
      );
      expect(Number(removedReactionCount.rows[0]?.count ?? '0')).toBe(0);
    } finally {
      await database.query('delete from "social_reactions" where "content_id" in ($1, $2)', [
        contentId,
        hiddenContentId,
      ]);
      await database.query('delete from "social_comments" where "content_id" in ($1, $2)', [
        contentId,
        hiddenContentId,
      ]);
      await database.query('delete from "audit_events" where "actor_id" in ($1, $2, $3)', [
        responsibleAccountId,
        unrelatedAccountId,
        agentId,
      ]);
      await database.query('delete from "permission_grants" where "agent_id" = $1', [agentId]);
      await database.query('delete from "social_content" where "id" in ($1, $2)', [
        contentId,
        hiddenContentId,
      ]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2)', [
        responsibleAccountId,
        unrelatedAccountId,
      ]);
    }
  });
});
