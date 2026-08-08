import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const IDEMPOTENCY_KEY = 'mcf-c2-global-idempotency-0001';

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
    objective: 'Retry the same C2 key after a definite pre-write failure.',
    expectedOutcome: 'Only a fingerprint-compatible retry may replace the failed binding.',
    scope: ['C2 persistent global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['safe compatible retry after pre-write failure'],
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

  it('retains a pre-write failure tombstone and releases it only for a compatible retry', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const missionC = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const phaseC = randomUUID();
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
          ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $7, $7),
          ($3, $4::jsonb, 'EXECUTING', null, 'Gabriel', 1, $7, $7),
          ($5, $6::jsonb, 'EXECUTING', null, 'Gabriel', 1, $7, $7)`,
        [
          missionA,
          missionContract('C2 persistent binding A'),
          missionB,
          missionContract('C2 persistent binding B'),
          missionC,
          missionContract('C2 persistent binding C'),
          now,
        ],
      );

      const outcomes = await Promise.allSettled([
        ledger.reserve(request(missionA, phaseA), 'github-pr-collaboration-write-v1'),
        ledger.reserve(request(missionB, phaseB), 'github-pr-collaboration-write-v1'),
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

      const failed = await database.query<{
        status: string;
        scopeKey: string | null;
        fingerprint: string | null;
      }>(
        `select "status", "idempotency_scope_key" as "scopeKey",
                "idempotency_fingerprint" as "fingerprint"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [firstAttemptId],
      );
      expect(failed.rows[0]?.status).toBe('FAILED');
      expect(failed.rows[0]?.scopeKey).not.toBeNull();
      expect(failed.rows[0]?.fingerprint).not.toBeNull();

      const loserRequest =
        outcomes[0]?.status === 'rejected'
          ? request(missionA, phaseA)
          : request(missionB, phaseB);
      const incompatibleLoserRequest = {
        ...loserRequest,
        inputs: {
          ...loserRequest.inputs,
          comment_body: 'different payload with reused key',
        },
      };

      await expect(
        ledger.reserve(incompatibleLoserRequest, 'github-pr-collaboration-write-v1'),
      ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' });

      const retainedAfterIncompatible = await database.query<{ scopeKey: string | null }>(
        `select "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts" where "attempt_id" = $1`,
        [firstAttemptId],
      );
      expect(retainedAfterIncompatible.rows[0]?.scopeKey).not.toBeNull();

      const retryAttempt = await ledger.reserve(loserRequest, 'github-pr-collaboration-write-v1');
      expect(retryAttempt).not.toBe(firstAttemptId);

      const bindings = await database.query<{
        attemptId: string;
        status: string;
        scopeKey: string | null;
      }>(
        `select "attempt_id" as "attemptId", "status", "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts"
         where "attempt_id" = any($1::text[])
         order by "attempt_id"`,
        [[firstAttemptId, retryAttempt]],
      );
      const oldHolder = bindings.rows.find((row) => row.attemptId === firstAttemptId);
      const replacement = bindings.rows.find((row) => row.attemptId === retryAttempt);
      expect(oldHolder).toMatchObject({ status: 'FAILED', scopeKey: null });
      expect(replacement?.status).toBe('ALLOWED');
      expect(replacement?.scopeKey).not.toBeNull();

      await expect(
        ledger.reserve(
          request(missionC, phaseC, { comment_body: 'third mission incompatible payload' }),
          'github-pr-collaboration-write-v1',
        ),
      ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' });
    } finally {
      await database.query(
        `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
        [[missionA, missionB, missionC]],
      );
      await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
        [missionA, missionB, missionC],
      ]);
      await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [
        [missionA, missionB, missionC],
      ]);
    }
  });
});
