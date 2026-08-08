import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const IDEMPOTENCY_KEY = 'mcf-c2-expired-global-0001';

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
    objective: 'Recover an expired cross-mission C2 reservation.',
    expectedOutcome: 'Expired ALLOWED holder is abandoned and contender reserves atomically.',
    scope: ['C2 global lease recovery'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['expired holder recovered without releasing terminal bindings'],
    riskClass: 'B',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

describe('C2 expired global reservation recovery', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('abandons an expired ALLOWED holder from another mission before admitting the contender', async () => {
    const holderMission = randomUUID();
    const contenderMission = randomUUID();
    const holderPhase = randomUUID();
    const contenderPhase = randomUUID();
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
        [
          holderMission,
          missionContract('C2 expired global holder'),
          contenderMission,
          missionContract('C2 expired global contender'),
          now,
        ],
      );

      const holderAttempt = await ledger.reserve(
        request(holderMission, holderPhase),
        'github-pr-collaboration-write-v1',
      );

      await database.query(
        `update "mcf_external_action_attempts"
         set "lease_expires_at" = now() - interval '1 minute'
         where "attempt_id" = $1`,
        [holderAttempt],
      );

      const contenderAttempt = await ledger.reserve(
        request(contenderMission, contenderPhase),
        'github-pr-collaboration-write-v1',
      );
      expect(contenderAttempt).toEqual(expect.any(String));
      expect(contenderAttempt).not.toBe(holderAttempt);

      const attempts = await database.query<{
        attemptId: string;
        status: string;
        scopeKey: string | null;
      }>(
        `select
           "attempt_id" as "attemptId",
           "status",
           "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts"
         where "mission_id" = any($1::text[])
         order by "created_at"`,
        [[holderMission, contenderMission]],
      );
      expect(attempts.rows).toHaveLength(2);
      expect(attempts.rows.find((row) => row.attemptId === holderAttempt)).toMatchObject({
        status: 'ABANDONED',
        scopeKey: null,
      });
      expect(attempts.rows.find((row) => row.attemptId === contenderAttempt)).toMatchObject({
        status: 'ALLOWED',
      });
      expect(
        attempts.rows.find((row) => row.attemptId === contenderAttempt)?.scopeKey,
      ).toEqual(expect.any(String));

      const holderState = await database.query<{ activeAttemptId: string | null }>(
        `select "active_external_attempt_id" as "activeAttemptId"
         from "mcf_missions"
         where "id" = $1`,
        [holderMission],
      );
      expect(holderState.rows[0]?.activeAttemptId).toBeNull();

      const event = await database.query<{ payload: Record<string, unknown> }>(
        `select "payload"
         from "mcf_events"
         where "idempotency_key" = $1`,
        [`external-action:${holderAttempt}:abandoned`],
      );
      expect(event.rows[0]?.payload).toMatchObject({
        attemptId: holderAttempt,
        previousStatus: 'ALLOWED',
        reason: 'RESERVATION_EXPIRED',
        scope: 'GLOBAL_IDEMPOTENCY',
      });

      await ledger.recordFailed(contenderAttempt, {
        code: 'TARGET_NOT_FOUND',
        message: 'terminal contender result keeps the consumed global key bound',
        retryable: false,
        statusCode: 404,
      });

      await expect(
        ledger.reserve(
          request(holderMission, randomUUID()),
          'github-pr-collaboration-write-v1',
        ),
      ).rejects.toMatchObject({
        code: 'RESERVATION_CONFLICT',
        retryable: false,
      });
    } finally {
      await database.query(
        `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
        [[holderMission, contenderMission]],
      );
      await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
        [holderMission, contenderMission],
      ]);
      await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [
        [holderMission, contenderMission],
      ]);
    }
  });
});
