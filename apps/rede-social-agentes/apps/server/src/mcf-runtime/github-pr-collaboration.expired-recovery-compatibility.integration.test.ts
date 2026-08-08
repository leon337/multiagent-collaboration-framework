import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';

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
    objective: 'Recover only compatible expired C2 reservations.',
    expectedOutcome: 'Compatible retries recover; incompatible replacements remain blocked.',
    scope: ['C2 expired reservation compatibility'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['fingerprint compatibility enforced before releasing global binding'],
    riskClass: 'B',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

function request(missionId: string, phaseId: string, idempotencyKey: string, commentBody: string) {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: REPOSITORY,
      pull_request_number: 80,
      expected_head_sha: 'a'.repeat(40),
      idempotency_key: idempotencyKey,
      comment_body: commentBody,
    },
    tool: {
      provider: 'github',
      operation: 'comment-pr',
      resource: REPOSITORY,
    },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

describe('C2 compatible expired global recovery', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  async function insertMission(missionId: string, title: string, now: Date) {
    await database.query(
      `insert into "mcf_missions" (
        "id", "contract", "state", "current_phase_id", "current_agent_id",
        "version", "created_at", "updated_at"
      ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
      [missionId, missionContract(title), now],
    );
  }

  async function expire(attemptId: string) {
    await database.query(
      `update "mcf_external_action_attempts"
       set "lease_expires_at" = now() - interval '1 minute'
       where "attempt_id" = $1`,
      [attemptId],
    );
  }

  async function cleanup(missionIds: string[]) {
    await database.query(
      `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
      [missionIds],
    );
    await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
      missionIds,
    ]);
    await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [missionIds]);
  }

  it('allows the same mission to replace its locally abandoned expired holder with the same fingerprint', async () => {
    const missionId = randomUUID();
    const firstPhase = randomUUID();
    const retryPhase = randomUUID();
    const key = 'mcf-c2-same-mission-expired-0001';
    const now = new Date();

    try {
      await insertMission(missionId, 'C2 same-mission expired recovery', now);
      const firstAttempt = await ledger.reserve(
        request(missionId, firstPhase, key, 'same logical checkpoint'),
        'github-pr-collaboration-write-v1',
      );
      await expire(firstAttempt);

      const retryAttempt = await ledger.reserve(
        request(missionId, retryPhase, key, 'same logical checkpoint'),
        'github-pr-collaboration-write-v1',
      );

      expect(retryAttempt).not.toBe(firstAttempt);

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
         where "mission_id" = $1
         order by "created_at"`,
        [missionId],
      );

      expect(attempts.rows).toHaveLength(2);
      expect(attempts.rows.find((row) => row.attemptId === firstAttempt)).toMatchObject({
        status: 'ABANDONED',
        scopeKey: null,
      });
      expect(attempts.rows.find((row) => row.attemptId === retryAttempt)).toMatchObject({
        status: 'ALLOWED',
      });
      expect(attempts.rows.find((row) => row.attemptId === retryAttempt)?.scopeKey).toEqual(
        expect.any(String),
      );
    } finally {
      await cleanup([missionId]);
    }
  });

  it('rejects an incompatible cross-mission replacement and still lets the holder recover compatibly', async () => {
    const holderMission = randomUUID();
    const contenderMission = randomUUID();
    const holderPhase = randomUUID();
    const contenderPhase = randomUUID();
    const holderRetryPhase = randomUUID();
    const key = 'mcf-c2-incompatible-expired-0001';
    const now = new Date();

    try {
      await insertMission(holderMission, 'C2 incompatible holder', now);
      await insertMission(contenderMission, 'C2 incompatible contender', now);

      const holderAttempt = await ledger.reserve(
        request(holderMission, holderPhase, key, 'original logical payload'),
        'github-pr-collaboration-write-v1',
      );
      await expire(holderAttempt);

      await expect(
        ledger.reserve(
          request(contenderMission, contenderPhase, key, 'different logical payload'),
          'github-pr-collaboration-write-v1',
        ),
      ).rejects.toMatchObject({
        code: 'RESERVATION_CONFLICT',
        retryable: false,
      });

      const afterRejectedContender = await database.query<{
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
      expect(afterRejectedContender.rows).toHaveLength(1);
      expect(afterRejectedContender.rows[0]).toMatchObject({
        attemptId: holderAttempt,
        status: 'ALLOWED',
      });
      expect(afterRejectedContender.rows[0]?.scopeKey).toEqual(expect.any(String));

      const recoveredAttempt = await ledger.reserve(
        request(holderMission, holderRetryPhase, key, 'original logical payload'),
        'github-pr-collaboration-write-v1',
      );
      expect(recoveredAttempt).not.toBe(holderAttempt);

      const finalAttempts = await database.query<{
        attemptId: string;
        status: string;
        scopeKey: string | null;
      }>(
        `select
           "attempt_id" as "attemptId",
           "status",
           "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts"
         where "mission_id" = $1
         order by "created_at"`,
        [holderMission],
      );
      expect(finalAttempts.rows).toHaveLength(2);
      expect(finalAttempts.rows.find((row) => row.attemptId === holderAttempt)).toMatchObject({
        status: 'ABANDONED',
        scopeKey: null,
      });
      expect(finalAttempts.rows.find((row) => row.attemptId === recoveredAttempt)).toMatchObject({
        status: 'ALLOWED',
      });
    } finally {
      await cleanup([holderMission, contenderMission]);
    }
  });
});
