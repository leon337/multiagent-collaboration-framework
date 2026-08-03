import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import {
  ActiveResponsibilityRequiredError,
  AgentHandleAlreadyExistsError,
  InvalidAgentTransitionError,
} from './agent.errors.js';
import { PostgresAgentRepository } from './postgres-agent.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

interface AuditRow extends DatabaseRow {
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  correlation_id: string;
}

describe('PostgresAgentRepository integration', () => {
  let database: DatabaseService;
  let identities: PostgresIdentityRepository;
  let agents: PostgresAgentRepository;

  beforeAll(() => {
    database = new DatabaseService();
    identities = new PostgresIdentityRepository(database);
    agents = new PostgresAgentRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('creates one responsible link and enforces state authority', async () => {
    const responsibleAccountId = randomUUID();
    const unrelatedAccountId = randomUUID();
    const agentId = randomUUID();
    const responsibilityId = randomUUID();
    const handle = `agent_${randomUUID().replaceAll('-', '').slice(0, 20)}`;

    try {
      await identities.createHumanAccount({
        id: responsibleAccountId,
        email: `responsible-${responsibleAccountId}@example.test`,
        displayName: 'Responsible Human',
        passwordHash: 'scrypt$integration$responsible',
        correlationId: 'integration-responsible',
      });
      await identities.createHumanAccount({
        id: unrelatedAccountId,
        email: `unrelated-${unrelatedAccountId}@example.test`,
        displayName: 'Unrelated Human',
        passwordHash: 'scrypt$integration$unrelated',
        correlationId: 'integration-unrelated',
      });

      const created = await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId,
        responsibleAccountId,
        handle,
        displayName: 'Integration Agent',
        bio: 'A supervised integration agent.',
        capabilities: ['analysis', 'planning'],
        correlationId: 'integration-agent-create',
      });

      expect(created.agent).toMatchObject({ id: agentId, handle, status: 'DRAFT' });
      expect(created.responsibility).toMatchObject({
        id: responsibilityId,
        responsibleAccountId,
        status: 'ACTIVE',
      });

      await expect(
        agents.transitionAgentState({
          agentId,
          responsibleAccountId: unrelatedAccountId,
          targetStatus: 'ACTIVE',
          correlationId: 'integration-unrelated-transition',
        }),
      ).rejects.toBeInstanceOf(ActiveResponsibilityRequiredError);

      await expect(
        agents.transitionAgentState({
          agentId,
          responsibleAccountId,
          targetStatus: 'ACTIVE',
          correlationId: 'integration-activate',
        }),
      ).resolves.toMatchObject({ status: 'ACTIVE' });

      await expect(
        agents.transitionAgentState({
          agentId,
          responsibleAccountId,
          targetStatus: 'PAUSED',
          correlationId: 'integration-pause',
        }),
      ).resolves.toMatchObject({ status: 'PAUSED' });

      await expect(
        agents.transitionAgentState({
          agentId,
          responsibleAccountId,
          targetStatus: 'REVOKED',
          correlationId: 'integration-revoke-agent',
        }),
      ).resolves.toMatchObject({ status: 'REVOKED' });

      await expect(
        agents.transitionAgentState({
          agentId,
          responsibleAccountId,
          targetStatus: 'ACTIVE',
          correlationId: 'integration-reactivate-revoked',
        }),
      ).rejects.toBeInstanceOf(InvalidAgentTransitionError);

      await expect(
        agents.createAgentWithResponsibility({
          agentId: randomUUID(),
          responsibilityId: randomUUID(),
          responsibleAccountId,
          handle,
          displayName: 'Duplicate Agent',
          bio: null,
          capabilities: [],
          correlationId: 'integration-duplicate-handle',
        }),
      ).rejects.toBeInstanceOf(AgentHandleAlreadyExistsError);

      const handleCount = await database.query<CountRow>(
        'select count(*)::text as "count" from "agent_profiles" where "handle" = $1',
        [handle],
      );
      expect(handleCount.rows[0]?.count).toBe('1');

      const auditResult = await database.query<AuditRow>(
        `
          select "event_type", "aggregate_type", "aggregate_id", "correlation_id"
          from "audit_events"
          where "correlation_id" in ($1, $2, $3, $4)
          order by "occurred_at", "event_type"
        `,
        [
          'integration-agent-create',
          'integration-activate',
          'integration-pause',
          'integration-revoke-agent',
        ],
      );

      expect(
        auditResult.rows.map((row) => ({
          eventType: row.event_type,
          aggregateType: row.aggregate_type,
          aggregateId: row.aggregate_id,
          correlationId: row.correlation_id,
        })),
      ).toEqual([
        {
          eventType: 'AGENT_PROFILE_CREATED',
          aggregateType: 'AGENT',
          aggregateId: agentId,
          correlationId: 'integration-agent-create',
        },
        {
          eventType: 'RESPONSIBILITY_LINK_ACTIVATED',
          aggregateType: 'RESPONSIBILITY_LINK',
          aggregateId: responsibilityId,
          correlationId: 'integration-agent-create',
        },
        {
          eventType: 'AGENT_STATE_CHANGED',
          aggregateType: 'AGENT',
          aggregateId: agentId,
          correlationId: 'integration-activate',
        },
        {
          eventType: 'AGENT_STATE_CHANGED',
          aggregateType: 'AGENT',
          aggregateId: agentId,
          correlationId: 'integration-pause',
        },
        {
          eventType: 'AGENT_STATE_CHANGED',
          aggregateType: 'AGENT',
          aggregateId: agentId,
          correlationId: 'integration-revoke-agent',
        },
      ]);
    } finally {
      await database.query(
        `
          delete from "audit_events"
          where "actor_id" in ($1, $2)
             or "aggregate_id" in ($1, $2, $3, $4)
        `,
        [responsibleAccountId, unrelatedAccountId, agentId, responsibilityId],
      );
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2)', [
        responsibleAccountId,
        unrelatedAccountId,
      ]);
    }
  });
});
