import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const KEY = 'mcf-c2-global-idempotency-0001';
const ADAPTER = 'github-pr-collaboration-write-v1';

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

function contract(title: string) {
  return JSON.stringify({
    title,
    objective: 'Retry a C2 request after a definite pre-write failure.',
    expectedOutcome: 'Only consumed mutations keep the global binding.',
    scope: ['C2 global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['safe retry after pre-write failure'],
    riskClass: 'B',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

function request(
  missionId: string,
  phaseId: string,
  body = 'same logical checkpoint',
) {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: REPOSITORY,
      pull_request_number: 80,
      expected_head_sha: 'a'.repeat(40),
      idempotency_key: KEY,
      comment_body: body,
    },
    tool: {
      provider: 'github',
      operation: 'comment-pr',
      resource: REPOSITORY,
    },
    context: {
      missionId,
      phaseId,
      expectedMissionVersion: 1,
    },
  };
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

  it('releases a binding after a definite pre-write failure', async () => {
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
          contract('C2 idempotency A'),
          missionB,
          contract('C2 idempotency B'),
          now,
        ],
      );

      const results = await Promise.allSettled([
        ledger.reserve(request(missionA, phaseA), ADAPTER),
        ledger.reserve(request(missionB, phaseB), ADAPTER),
      ]);
      const winner = results.find((result) => result.status === 'fulfilled');
      const loser = results.find((result) => result.status === 'rejected');

      expect(winner?.status).toBe('fulfilled');
      expect(loser?.status).toBe('rejected');
      if (!winner || winner.status !== 'fulfilled') {
        throw new Error('expected one reserved C2 attempt');
      }

      await ledger.recordFailed(winner.value, {
        code: 'TARGET_NOT_FOUND',
        message: 'definite pre-write target lookup failure',
        retryable: false,
        statusCode: 404,
      });

      const failed = await database.query<{
        status: string;
        scopeKey: string | null;
      }>(
        `select "status", "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [winner.value],
      );
      expect(failed.rows[0]).toEqual({
        status: 'FAILED',
        scopeKey: null,
      });

      const loserRequest =
        results[0]?.status === 'rejected'
          ? request(missionA, phaseA)
          : request(missionB, phaseB);
      const retryId = await ledger.reserve(loserRequest, ADAPTER);
      expect(retryId).not.toBe(winner.value);

      const rebound = await database.query<{
        status: string;
        count: string;
      }>(
        `select min("status") as "status", count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "idempotency_scope_key" is not null
           and "operation" = 'comment-pr'
           and "resource" = $1`,
        [REPOSITORY],
      );
      expect(rebound.rows[0]).toEqual({
        status: 'ALLOWED',
        count: '1',
      });

      const changed =
        results[0]?.status === 'fulfilled'
          ? request(missionA, randomUUID(), 'different payload')
          : request(missionB, randomUUID(), 'different payload');
      await expect(ledger.reserve(changed, ADAPTER)).rejects.toMatchObject({
        code: 'RESERVATION_CONFLICT',
      });
    } finally {
      await database.query(
        `delete from "mcf_external_action_attempts"
         where "mission_id" = any($1::text[])`,
        [[missionA, missionB]],
      );
      await database.query(
        `delete from "mcf_events"
         where "mission_id" = any($1::text[])`,
        [[missionA, missionB]],
      );
      await database.query(
        `delete from "mcf_missions"
         where "id" = any($1::text[])`,
        [[missionA, missionB]],
      );
    }
  });
});
