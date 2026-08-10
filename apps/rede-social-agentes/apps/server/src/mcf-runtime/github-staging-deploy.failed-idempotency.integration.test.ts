import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionRequest } from './external-action.contracts.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
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
    objective: 'Exercise staging idempotency failure recovery.',
    expectedOutcome: 'FAILED is retryable while UNKNOWN remains durably bound.',
    scope: ['Gate D persistent global idempotency'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['safe retry semantics'],
    riskClass: 'C',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-DEPLOY-VALIDATE'],
    sourceOfTruth: ['MCF-RUNTIME-006-GATE-D'],
  });
}

function request(
  missionId: string,
  phaseId: string,
  idempotencyKey: string,
): ExternalActionRequest {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: REPOSITORY,
      artifact_or_commit: RELEASE_SHA,
      target_environment: 'staging',
      idempotency_key: idempotencyKey,
    },
    tool: {
      provider: 'github',
      operation: 'deploy-staging',
      resource: REPOSITORY,
    },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

async function insertMissions(database: DatabaseService, missionA: string, missionB: string) {
  const now = new Date();
  await database.query(
    `insert into "mcf_missions" (
      "id", "contract", "state", "current_phase_id", "current_agent_id",
      "version", "created_at", "updated_at"
    ) values
      ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $5, $5),
      ($3, $4::jsonb, 'EXECUTING', null, 'Gabriel', 1, $5, $5)`,
    [
      missionA,
      missionContract('Gate D failed holder'),
      missionB,
      missionContract('Gate D retry'),
      now,
    ],
  );
}

async function cleanup(database: DatabaseService, missionIds: string[]) {
  await database.query(`delete from "mcf_tool_receipts" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(`delete from "mcf_handoffs" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(`delete from "mcf_phases" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(
    `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
    [missionIds],
  );
  await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [missionIds]);
}

describe('Gate D failed staging idempotency recovery', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('allows a compatible staging retry after a definitively-not-applied FAILED attempt', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const idempotencyKey = `mcf-gate-d-failed-${randomUUID()}`;

    try {
      await insertMissions(database, missionA, missionB);
      const firstAttempt = await ledger.reserve(
        request(missionA, phaseA, idempotencyKey),
        'github-actions-staging-deploy-v1',
      );
      await ledger.recordExecuting(firstAttempt);
      await ledger.recordFailed(firstAttempt, {
        code: 'LEDGER_FAILURE',
        message: 'pre-dispatch reconciliation metadata persistence failed',
        retryable: true,
        statusCode: null,
      });

      const failed = await database.query<{ scopeKey: string | null; status: string }>(
        `select "idempotency_scope_key" as "scopeKey", "status"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [firstAttempt],
      );
      expect(failed.rows[0]?.status).toBe('FAILED');
      expect(failed.rows[0]?.scopeKey).not.toBeNull();

      const retryAttempt = await ledger.reserve(
        request(missionB, phaseB, idempotencyKey),
        'github-actions-staging-deploy-v1',
      );
      expect(retryAttempt).not.toBe(firstAttempt);

      const holders = await database.query<{ attemptId: string; scopeKey: string | null }>(
        `select "attempt_id" as "attemptId", "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts"
         where "mission_id" = any($1::text[])
         order by "created_at" asc`,
        [[missionA, missionB]],
      );
      expect(holders.rows).toHaveLength(2);
      expect(holders.rows.find((row) => row.attemptId === firstAttempt)?.scopeKey).toBeNull();
      expect(holders.rows.find((row) => row.attemptId === retryAttempt)?.scopeKey).not.toBeNull();
    } finally {
      await cleanup(database, [missionA, missionB]);
    }
  });

  it('keeps UNKNOWN staging attempts globally bound', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const idempotencyKey = `mcf-gate-d-unknown-${randomUUID()}`;

    try {
      await insertMissions(database, missionA, missionB);
      const firstAttempt = await ledger.reserve(
        request(missionA, phaseA, idempotencyKey),
        'github-actions-staging-deploy-v1',
      );
      await ledger.recordExecuting(firstAttempt);
      await database.query(
        `update "mcf_external_action_attempts"
         set "status" = 'UNKNOWN',
             "failure_code" = 'EXTERNAL_EFFECT_UNKNOWN',
             "failure_message" = 'test ambiguous provider effect',
             "updated_at" = now()
         where "attempt_id" = $1`,
        [firstAttempt],
      );

      await expect(
        ledger.reserve(
          request(missionB, phaseB, idempotencyKey),
          'github-actions-staging-deploy-v1',
        ),
      ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT', retryable: false });

      const unknown = await database.query<{ scopeKey: string | null; status: string }>(
        `select "idempotency_scope_key" as "scopeKey", "status"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [firstAttempt],
      );
      expect(unknown.rows[0]?.status).toBe('UNKNOWN');
      expect(unknown.rows[0]?.scopeKey).not.toBeNull();
    } finally {
      await cleanup(database, [missionA, missionB]);
    }
  });
});
