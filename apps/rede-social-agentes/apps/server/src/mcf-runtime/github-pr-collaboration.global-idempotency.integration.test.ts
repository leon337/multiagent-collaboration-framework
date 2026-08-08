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
    objective: 'Persistently bind the same C2 provider mutation key across missions.',
    expectedOutcome: 'One global idempotency scope remains bound after terminal state.',
    scope: ['C2 persistent global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['cross-mission duplicate creation and key reuse blocked'],
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

  it('persists one repository/PR/operation/key binding across missions after terminal state', async () => {
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
          missionContract('C2 persistent binding A'),
          missionB,
          missionContract('C2 persistent binding B'),
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

      const bound = await database.query<{ count: string }>(
        `select count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "idempotency_scope_key" is not null
           and "operation" = 'comment-pr'
           and "resource" = $1`,
        [REPOSITORY],
      );
      expect(bound.rows[0]?.count).toBe('1');

      await ledger.recordFailed(fulfilled[0]!.value, {
        code: 'TARGET_NOT_FOUND',
        message: 'definite pre-provider failure while preserving consumed idempotency key',
        retryable: false,
        statusCode: 404,
      });

      const loser =
        outcomes[0]?.status === 'rejected' ? request(missionA, phaseA) : request(missionB, phaseB);
      await expect(ledger.reserve(loser, 'github-pr-collaboration-write-v1')).rejects.toMatchObject(
        {
          code: 'RESERVATION_CONFLICT',
        },
      );

      const changedPayload =
        outcomes[0]?.status === 'rejected'
          ? request(missionA, phaseA, { comment_body: 'different payload with reused key' })
          : request(missionB, phaseB, { comment_body: 'different payload with reused key' });
      await expect(
        ledger.reserve(changedPayload, 'github-pr-collaboration-write-v1'),
      ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' });

      const persisted = await database.query<{ status: string; count: string }>(
        `select min("status") as "status", count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "idempotency_scope_key" is not null
           and "operation" = 'comment-pr'
           and "resource" = $1`,
        [REPOSITORY],
      );
      expect(persisted.rows[0]?.count).toBe('1');
      expect(persisted.rows[0]?.status).toBe('FAILED');
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
