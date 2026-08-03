import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import { PostgresPermissionRepository } from '../permissions/postgres-permission.repository.js';
import {
  ContentPermissionDeniedError,
  ContentResourceAccessDeniedError,
  ContentStateConflictError,
} from './content.errors.js';
import { PostgresContentRepository } from './postgres-content.repository.js';

interface QuotaRow extends DatabaseRow {
  quota_used: number;
}

interface CountRow extends DatabaseRow {
  count: string;
}

describe('PostgresContentRepository integration', () => {
  let database: DatabaseService;
  let identities: PostgresIdentityRepository;
  let agents: PostgresAgentRepository;
  let permissions: PostgresPermissionRepository;
  let content: PostgresContentRepository;

  beforeAll(() => {
    database = new DatabaseService();
    identities = new PostgresIdentityRepository(database);
    agents = new PostgresAgentRepository(database);
    permissions = new PostgresPermissionRepository(database);
    content = new PostgresContentRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('creates atomically, preserves quota on rollback and requires human publication', async () => {
    const responsibleAccountId = randomUUID();
    const unrelatedAccountId = randomUUID();
    const agentId = randomUUID();
    const responsibilityId = randomUUID();
    const grantId = randomUUID();
    const contentId = randomUUID();
    const handle = `content_${randomUUID().replaceAll('-', '').slice(0, 18)}`;

    try {
      await identities.createHumanAccount({
        id: responsibleAccountId,
        email: `content-responsible-${responsibleAccountId}@example.test`,
        displayName: 'Content Responsible',
        passwordHash: 'scrypt$integration$responsible',
        correlationId: `account-create-${responsibleAccountId}`,
      });
      await identities.createHumanAccount({
        id: unrelatedAccountId,
        email: `content-unrelated-${unrelatedAccountId}@example.test`,
        displayName: 'Content Unrelated',
        passwordHash: 'scrypt$integration$unrelated',
        correlationId: `account-create-${unrelatedAccountId}`,
      });
      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId,
        responsibleAccountId,
        handle,
        displayName: 'Content Integration Agent',
        bio: null,
        capabilities: ['writing'],
        correlationId: `agent-create-${agentId}`,
      });
      await agents.transitionAgentState({
        agentId,
        responsibleAccountId,
        targetStatus: 'ACTIVE',
        correlationId: `agent-activate-${agentId}`,
      });

      await expect(
        content.createDraft({
          id: contentId,
          agentId,
          responsibleAccountId,
          body: 'Draft without permission',
          scope: null,
          correlationId: `content-denied-${agentId}`,
        }),
      ).rejects.toMatchObject<Partial<ContentPermissionDeniedError>>({
        reason: 'PERMISSION_NOT_GRANTED',
      });

      await permissions.grantPermission({
        id: grantId,
        agentId,
        responsibleAccountId,
        permission: 'content.draft.create',
        scope: null,
        quotaLimit: 2,
        validUntil: new Date(Date.now() + 60 * 60 * 1000),
        correlationId: `content-grant-${agentId}`,
      });

      const draft = await content.createDraft({
        id: contentId,
        agentId,
        responsibleAccountId,
        body: 'The first supervised post.',
        scope: null,
        correlationId: `content-create-${agentId}`,
      });
      expect(draft).toMatchObject({
        id: contentId,
        authorAgentId: agentId,
        responsibleAccountId,
        approvedByAccountId: null,
        status: 'DRAFT',
      });

      await expect(
        content.createDraft({
          id: contentId,
          agentId,
          responsibleAccountId,
          body: 'Duplicate identifier must rollback.',
          scope: null,
          correlationId: `content-rollback-${agentId}`,
        }),
      ).rejects.toBeTruthy();

      const quota = await database.query<QuotaRow>(
        'select "quota_used" from "permission_grants" where "id" = $1',
        [grantId],
      );
      expect(quota.rows[0]?.quota_used).toBe(1);

      await expect(
        content.publish({
          contentId,
          responsibleAccountId: unrelatedAccountId,
          correlationId: `content-unrelated-${agentId}`,
        }),
      ).rejects.toBeInstanceOf(ContentResourceAccessDeniedError);

      const published = await content.publish({
        contentId,
        responsibleAccountId,
        correlationId: `content-publish-${agentId}`,
      });
      expect(published).toMatchObject({
        status: 'PUBLISHED',
        authorAgentId: agentId,
        approvedByAccountId: responsibleAccountId,
      });
      expect(published.publishedAt).not.toBeNull();

      await expect(
        content.publish({
          contentId,
          responsibleAccountId,
          correlationId: `content-republish-${agentId}`,
        }),
      ).rejects.toBeInstanceOf(ContentStateConflictError);

      const loaded = await content.get({ contentId, responsibleAccountId });
      expect(loaded.body).toBe('The first supervised post.');
      expect(loaded.status).toBe('PUBLISHED');

      const audit = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "audit_events"
          where "aggregate_id" = $1
            and "event_type" in ('CONTENT_DRAFT_CREATED', 'CONTENT_PUBLISHED')
        `,
        [contentId],
      );
      expect(Number(audit.rows[0]?.count ?? '0')).toBe(2);
    } finally {
      await database.query(
        `
          delete from "audit_events"
          where "actor_id" in ($1, $2, $3)
             or "aggregate_id" in ($1, $2, $3, $4, $5)
        `,
        [responsibleAccountId, unrelatedAccountId, agentId, grantId, contentId],
      );
      await database.query('delete from "social_content" where "author_agent_id" = $1', [agentId]);
      await database.query('delete from "permission_grants" where "agent_id" = $1', [agentId]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2)', [
        responsibleAccountId,
        unrelatedAccountId,
      ]);
    }
  });
});
