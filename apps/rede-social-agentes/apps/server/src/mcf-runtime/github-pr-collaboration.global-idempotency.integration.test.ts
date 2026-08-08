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
    objective: 'Serialize the same C2 provider mutation across missions.',
    expectedOutcome: 'Only one active global idempotency scope exists.',
    scope: ['C2 global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['cross-mission duplicate creation blocked'],
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

  it('allows only one ALLOWED attempt for the same repository/PR/operation/key across missions', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const now = new Date();

    const request = (missionId: string, phaseId: string) => ({
      skill,
      agentId: 'Gabriel',
      inputs: {
        authorizedScope: true,
        repository: REPOSITORY,
        pull_request_number: 80,
        expected_head_sha: 'a'.repeat(40),
        idempotency_key: IDEMPOTENCY_KEY,
        comment_body: 'same logical checkpoint',
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
        [missionA, missionContract('C2 global lock A'), missionB, missionContract('C2 global lock B'), now],
      );

      const outcomes = await Promise.allSettled([
        ledger.reserve(
          request(missionA, phaseA),
          'github-pr-collaboration-write-v1',
        ),
        ledger.reserve(
          request(missionB, phaseB),
          'github-pr-collaboration-write-v1',
        ),
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
        retryable: true,
      });

      const active = await database.query<{ count: string }>(
        `select count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "idempotency_scope_key" is not null
           and "status" = 'ALLOWED'
           and "operation" = 'comment-pr'
           and "resource" = $1`,
        [REPOSITORY],
      );
      expect(active.rows[0]?.count).toBe('1');

      await ledger.recordFailed(fulfilled[0]!.value, {
        code: 'TARGET_NOT_FOUND',
        message: 'definite pre-provider failure for lock release test',
        retryable: false,
        statusCode: 404,
      });

      const loser = outcomes[0]?.status === 'rejected'
        ? request(missionA, phaseA)
        : request(missionB, phaseB);
      await expect(
        ledger.reserve(loser, 'github-pr-collaboration-write-v1'),
      ).resolves.toEqual(expect.any(String));
    } finally {
      await database.query(
        `delete from "mcf_external_action_attempts" where "mission_id" = any($1::uuid[])`,
        [[missionA, missionB]],
      );
      await database.query(
        `delete from "mcf_events" where "mission_id" = any($1::uuid[])`,
        [[missionA, missionB]],
      );
      await database.query(
        `delete from "mcf_missions" where "id" = any($1::uuid[])`,
        [[missionA, missionB]],
      );
    }
  });
});
