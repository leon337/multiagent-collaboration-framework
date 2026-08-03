import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import {
  PermissionGrantAlreadyExistsError,
  PermissionResourceAccessDeniedError,
} from './permission.errors.js';
import { PermissionService } from './permission.service.js';
import { PostgresPermissionRepository } from './postgres-permission.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

describe('PostgresPermissionRepository integration', () => {
  let database: DatabaseService;
  let identities: PostgresIdentityRepository;
  let agents: PostgresAgentRepository;
  let permissions: PostgresPermissionRepository;

  beforeAll(() => {
    database = new DatabaseService();
    identities = new PostgresIdentityRepository(database);
    agents = new PostgresAgentRepository(database);
    permissions = new PostgresPermissionRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('denies by default and enforces responsibility, quota, expiry and revocation', async () => {
    const responsibleAccountId = randomUUID();
    const unrelatedAccountId = randomUUID();
    const agentId = randomUUID();
    const responsibilityId = randomUUID();
    const grantId = randomUUID();
    const expiredGrantId = randomUUID();
    const handle = `permission_${randomUUID().replaceAll('-', '').slice(0, 18)}`;

    try {
      await identities.createHumanAccount({
        id: responsibleAccountId,
        email: `permission-responsible-${responsibleAccountId}@example.test`,
        displayName: 'Permission Responsible',
        passwordHash: 'scrypt$integration$responsible',
        correlationId: `account-create-${responsibleAccountId}`,
      });
      await identities.createHumanAccount({
        id: unrelatedAccountId,
        email: `permission-unrelated-${unrelatedAccountId}@example.test`,
        displayName: 'Permission Unrelated',
        passwordHash: 'scrypt$integration$unrelated',
        correlationId: `account-create-${unrelatedAccountId}`,
      });

      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId,
        responsibleAccountId,
        handle,
        displayName: 'Permission Integration Agent',
        bio: null,
        capabilities: ['analysis'],
        correlationId: `agent-create-${agentId}`,
      });
      await agents.transitionAgentState({
        agentId,
        responsibleAccountId,
        targetStatus: 'ACTIVE',
        correlationId: `agent-activate-${agentId}`,
      });

      const defaultDenied = await permissions.evaluatePermission({
        agentId,
        responsibleAccountId,
        permission: 'agent.profile.read',
        scope: null,
        correlationId: `permission-default-deny-${agentId}`,
      });
      expect(defaultDenied).toMatchObject({
        allowed: false,
        reason: 'PERMISSION_NOT_GRANTED',
        grantId: null,
      });

      const grant = await permissions.grantPermission({
        id: grantId,
        agentId,
        responsibleAccountId,
        permission: 'content.draft.create',
        scope: { resourceType: 'community', resourceId: 'community-1' },
        quotaLimit: 2,
        validUntil: new Date(Date.now() + 60 * 60 * 1000),
        correlationId: `permission-grant-${agentId}`,
      });
      expect(grant).toMatchObject({ status: 'ACTIVE', quotaLimit: 2, quotaUsed: 0 });

      await expect(
        permissions.grantPermission({
          id: randomUUID(),
          agentId,
          responsibleAccountId,
          permission: 'content.draft.create',
          scope: { resourceType: 'community', resourceId: 'community-1' },
          quotaLimit: 2,
          validUntil: null,
          correlationId: `permission-duplicate-${agentId}`,
        }),
      ).rejects.toBeInstanceOf(PermissionGrantAlreadyExistsError);

      const first = await permissions.evaluatePermission({
        agentId,
        responsibleAccountId,
        permission: 'content.draft.create',
        scope: { resourceType: 'community', resourceId: 'community-1' },
        correlationId: `permission-evaluate-1-${agentId}`,
      });
      const second = await permissions.evaluatePermission({
        agentId,
        responsibleAccountId,
        permission: 'content.draft.create',
        scope: { resourceType: 'community', resourceId: 'community-1' },
        correlationId: `permission-evaluate-2-${agentId}`,
      });
      const exhausted = await permissions.evaluatePermission({
        agentId,
        responsibleAccountId,
        permission: 'content.draft.create',
        scope: { resourceType: 'community', resourceId: 'community-1' },
        correlationId: `permission-evaluate-3-${agentId}`,
      });

      expect(first).toMatchObject({ allowed: true, reason: 'ALLOWED', quotaRemaining: 1 });
      expect(second).toMatchObject({ allowed: true, reason: 'ALLOWED', quotaRemaining: 0 });
      expect(exhausted).toMatchObject({
        allowed: false,
        reason: 'QUOTA_EXHAUSTED',
        quotaRemaining: 0,
      });

      const service = new PermissionService(permissions, database);
      await expect(
        service.evaluate(
          agentId,
          { permission: 'content.draft.create' },
          unrelatedAccountId,
          `permission-unrelated-${agentId}`,
        ),
      ).rejects.toBeInstanceOf(PermissionResourceAccessDeniedError);

      await permissions.grantPermission({
        id: expiredGrantId,
        agentId,
        responsibleAccountId,
        permission: 'agent.audit.read',
        scope: null,
        quotaLimit: null,
        validUntil: new Date(Date.now() + 60 * 60 * 1000),
        correlationId: `permission-expiring-${agentId}`,
      });
      await database.query(
        `
          update "permission_grants"
          set "valid_from" = now() - interval '2 hours',
              "valid_until" = now() - interval '1 hour'
          where "id" = $1
        `,
        [expiredGrantId],
      );
      const expired = await permissions.evaluatePermission({
        agentId,
        responsibleAccountId,
        permission: 'agent.audit.read',
        scope: null,
        correlationId: `permission-expired-${agentId}`,
      });
      expect(expired).toMatchObject({ allowed: false, reason: 'GRANT_EXPIRED' });

      const revoked = await permissions.revokePermission({
        grantId,
        agentId,
        responsibleAccountId,
        correlationId: `permission-revoke-${agentId}`,
      });
      expect(revoked).toMatchObject({ status: 'REVOKED' });

      const afterRevocation = await permissions.evaluatePermission({
        agentId,
        responsibleAccountId,
        permission: 'content.draft.create',
        scope: { resourceType: 'community', resourceId: 'community-1' },
        correlationId: `permission-after-revoke-${agentId}`,
      });
      expect(afterRevocation).toMatchObject({
        allowed: false,
        reason: 'PERMISSION_NOT_GRANTED',
      });

      const auditCount = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "audit_events"
          where "actor_id" = $1
            and "event_type" in (
              'PERMISSION_GRANTED', 'PERMISSION_REVOKED',
              'PERMISSION_ALLOWED', 'PERMISSION_DENIED'
            )
        `,
        [agentId],
      );
      expect(Number(auditCount.rows[0]?.count ?? '0')).toBeGreaterThanOrEqual(7);
    } finally {
      await database.query(
        `
          delete from "audit_events"
          where "actor_id" in ($1, $2)
             or "aggregate_id" in ($1, $2, $3, $4, $5)
        `,
        [responsibleAccountId, unrelatedAccountId, agentId, grantId, expiredGrantId],
      );
      await database.query('delete from "permission_grants" where "agent_id" = $1', [agentId]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2)', [
        responsibleAccountId,
        unrelatedAccountId,
      ]);
    }
  });
});
