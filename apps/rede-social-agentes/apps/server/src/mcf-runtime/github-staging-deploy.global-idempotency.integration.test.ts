import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionRequest } from './external-action.contracts.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const IDEMPOTENCY_KEY = 'mcf-gate-d-global-idempotency-0001';
const RELEASE_SHA = 'b'.repeat(40);

const skill: McfSkillDefinition = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  name: 'Deploy Validate',
  version: '1.0.0',
  purpose: 'verified staging deployment',
  ownerAgents: ['Gabriel'],
  requiredInputs: ['artifact_or_commit', 'target_environment'],
  allowedTools: ['GitHub', 'Render'],
  forbiddenTools: ['public_production_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

function missionContract(title: string) {
  return JSON.stringify({
    title,
    objective: 'Serialize concurrent Gate D staging dispatches.',
    expectedOutcome: 'Only one mission may claim the same deploy idempotency key.',
    scope: ['Gate D persistent global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['one durable global reservation'],
    riskClass: 'C',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-DEPLOY-VALIDATE'],
    sourceOfTruth: ['MCF-RUNTIME-006-GATE-D'],
  });
}

function request(missionId: string, phaseId: string): ExternalActionRequest {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: REPOSITORY,
      artifact_or_commit: RELEASE_SHA,
      target_environment: 'staging',
      idempotency_key: IDEMPOTENCY_KEY,
    },
    tool: {
      provider: 'github',
      operation: 'deploy-staging',
      resource: REPOSITORY,
    },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

describe('Gate D global staging deploy idempotency', () => {
  let database: DatabaseService;
  let ledgerA: ExternalActionLedger;
  let ledgerB: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledgerA = new ExternalActionLedger(database);
    ledgerB = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('allows exactly one reservation across concurrent missions using the same deploy key', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const now = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values
          ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $5, $5),
          ($3, $4::jsonb, 'EXECUTING', null, 'Gabriel', 1, $5, $5)`,
        [
          missionA,
          missionContract('Gate D concurrent mission A'),
          missionB,
          missionContract('Gate D concurrent mission B'),
          now,
        ],
      );

      const outcomes = await Promise.allSettled([
        ledgerA.reserve(request(missionA, phaseA), 'github-actions-staging-deploy-v1'),
        ledgerB.reserve(request(missionB, phaseB), 'github-actions-staging-deploy-v1'),
      ]);

      const fulfilled = outcomes.filter(
        (outcome): outcome is PromiseFulfilledResult<string> => outcome.status === 'fulfilled',
      );
      const rejected = outcomes.filter(
        (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({
        code: 'RESERVATION_CONFLICT',
        retryable: false,
      });

      const attempts = await database.query<{
        missionId: string;
        scopeKey: string | null;
        status: string;
      }>(
        `select "mission_id" as "missionId", "idempotency_scope_key" as "scopeKey", "status"
         from "mcf_external_action_attempts"
         where "mission_id" = any($1::text[])`,
        [[missionA, missionB]],
      );

      expect(attempts.rows).toHaveLength(1);
      expect(attempts.rows[0]?.scopeKey).not.toBeNull();
      expect(attempts.rows[0]?.status).toBe('ALLOWED');
    } finally {
      await database.query(
        `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
        [[missionA, missionB]],
      );
      await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
        [missionA, missionB],
      ]);
      await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [
        [missionA, missionB],
      ]);
    }
  });
});
