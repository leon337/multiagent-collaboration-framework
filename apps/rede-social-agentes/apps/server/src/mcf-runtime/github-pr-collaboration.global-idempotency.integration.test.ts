import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const IDEMPOTENCY_KEY = 'mcf-c2-global-idempotency-0001';
const ADAPTER_ID = 'github-pr-collaboration-write-v1';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled GitHub PR collaboration',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: ['force-push', 'merge-with-red-ci'],
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
    objective: 'Serialize C2 mutations globally while allowing safe retry after definite pre-write failure.',
    expectedOutcome: 'Only active or externally-consumed logical mutations keep the global binding.',
    scope: ['C2 persistent global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: [
      'cross-mission duplicate creation blocked while reserved',
      'definite pre-write failure releases the binding',
      'incompatible reuse remains blocked after a compatible retry reserves the key',
    ],
    riskClass: 'B',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

describe('C2 global idempotency serialization', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('releases a definite pre-write FAILED binding so the same logical operation can retry', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const now = new Date();

    const request = (
      missionId: string,
      phaseId: string,
      overrides: Record<string, unknown> = {},
    ) => ({
      skill,
      agentId: 'Gabriel',
      inputs: {
        authorizedScope: true,
        repository: REPOSITORY,
        pull_request_number: 80,
        expected_head_sha: 'a'.repeat(40),
        idempotency_key: IDEMPOTENCY_KEY,
        comment_body: 'same logical checkpoint',
        ...overrides,
      },
      tool: {
        provider: 'github',
        operation: 'comment-pr',
        resource: REPOSITORY,
      },
      context: { missionId, phaseId, expectedMissionVersion: 1 },
    });

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
          missionContract('C2 global idempotency A'),
          missionB,
          missionContract('C2 global idempotency B'),
          now,
        ],
      );

      const outcomes = await Promise.allSettled([
        ledger.reserve(request(missionA, phaseA), ADAPTER_ID),
        ledger.reserve(request(missionB, phaseB), ADAPTER_ID),
      ]);

      const fulfilled = outcomes.filter(
        (outcome): outcome is PromiseFulfilledResult<string> => outcome.status === 'fulfilled',
      );
      const rejected = outcomes.filter(
        (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected',
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({ code: 'RESERVATION_CONFLICT' });

      const firstAttemptId = fulfilled[0]!.value;
      await ledger.recordFailed(firstAttemptId, {
        code: 'TARGET_NOT_FOUND',
        message: 'definite pre-write target lookup failure',
        retryable: false,
        statusCode: 404,
      });

      const failed = await database.query<{ status: string; scopeKey: string | null }>(
        `select "status", "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [firstAttemptId],
      );
      expect(failed.rows[0]).toEqual({ status: 'FAILED', scopeKey: null });

      const loserRequest =
        outcomes[0]?.status === 'rejected' ? request(missionA, phaseA) : request(missionB, phaseB);
      const retryAttemptId = await ledger.reserve(loserRequest, ADAPTER_ID);
      expect(retryAttemptId).toEqual(expect.any(String));
      expect(retryAttemptId).not.toBe(firstAttemptId);

      const rebound = await database.query<{ status: string; count: string }>(
        `select min("status") as "status", count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "idempotency_scope_key" is not null
           and "operation" = 'comment-pr'
           and "resource" = $1`,
        [REPOSITORY],
      );
      expect(rebound.rows[0]).toEqual({ status: 'ALLOWED', count: '1' });

      const changedPayload =
        outcomes[0]?.status === 'fulfilled'
          ? request(missionA, randomUUID(), { comment_body: 'different payload with reused key' })
          : request(missionB, randomUUID(), { comment_body: 'different payload with reused key' });
      await expect(ledger.reserve(changedPayload, ADAPTER_ID)).rejects.toMatchObject({
        code: 'RESERVATION_CONFLICT',
      });
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
