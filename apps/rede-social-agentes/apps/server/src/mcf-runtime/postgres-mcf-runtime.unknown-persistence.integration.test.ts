import { randomUUID } from 'node:crypto';

import type { McfToolReceipt } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

function missionContract() {
  return JSON.stringify({
    title: 'Persist UNKNOWN external action',
    objective: 'Persist the recovering mission outcome for an ambiguous C2 write.',
    expectedOutcome: 'Mission pointer clears while the global binding remains durable.',
    scope: ['MCF-RUNTIME-006-C2'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['UNKNOWN attempt is persistable'],
    riskClass: 'B',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

function partialReceipt(receiptId: string): McfToolReceipt {
  return {
    receiptId,
    provider: 'github',
    operation: 'comment-pr',
    resource: 'leon337/multiagent-collaboration-framework',
    externalId: null,
    commitSha: 'a'.repeat(40),
    status: 'PARTIAL',
    observedAt: new Date().toISOString(),
    payloadDigest: 'b'.repeat(64),
    metadata: {
      adapterId: 'github-pr-collaboration-write-v1',
      idempotencyKey: 'mcf-persist-unknown-0001',
      resultStatus: 'UNKNOWN',
      externalEffect: 'REVERSIBLE',
      readBackVerified: false,
    },
    signature: 'c'.repeat(64),
  };
}

describe('PostgresMcfRuntimeRepository UNKNOWN persistence', () => {
  let database: DatabaseService;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('persists RECOVERING for UNKNOWN and clears only the mission pointer, not the binding', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const attemptId = randomUUID();
    const receiptId = randomUUID();
    const scopeKey = `c2-unknown:${randomUUID()}`;
    const now = new Date();
    const futureLease = new Date(now.getTime() + 5 * 60_000);

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "active_external_attempt_id", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $4, $4)`,
        [missionId, missionContract(), attemptId, now],
      );

      await database.query(
        `insert into "mcf_external_action_attempts" (
          "attempt_id", "mission_id", "phase_id", "agent_id", "skill_id",
          "adapter_id", "provider", "operation", "resource", "idempotency_key",
          "idempotency_fingerprint", "idempotency_scope_key", "expected_mission_version",
          "status", "receipt_id", "failure_code", "failure_message",
          "lease_expires_at", "created_at", "updated_at"
        ) values (
          $1, $2, $3, 'Gabriel', 'MCF-GIT-PR-RELEASE',
          'github-pr-collaboration-write-v1', 'github', 'comment-pr',
          'leon337/multiagent-collaboration-framework', 'mcf-persist-unknown-0001',
          $4, $5, 1, 'UNKNOWN', $6, 'EXTERNAL_EFFECT_UNKNOWN',
          'provider effect requires reconciliation', $7, $8, $8
        )`,
        [attemptId, missionId, phaseId, 'd'.repeat(64), scopeKey, receiptId, futureLease, now],
      );

      const receipt = partialReceipt(receiptId);
      const result = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        externalAttemptId: attemptId,
        phase: {
          id: phaseId,
          missionId,
          skillId: 'MCF-GIT-PR-RELEASE',
          agentId: 'Gabriel',
          state: 'RECOVERING',
          cycle: 1,
          inputs: { operation: 'comment-pr' },
          expectedEvidence: ['signed PARTIAL/UNKNOWN receipt'],
          startedAt: now,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        },
        permissionProfile: 'SCOPED_WRITE',
        missionState: 'RECOVERING',
        nextAgentId: null,
        receipt,
        evidenceStatus: 'PENDING',
        handoff: null,
        events: [],
      });

      expect(result.mission.state).toBe('RECOVERING');
      expect(result.mission.version).toBe(2);
      expect(result.phase.state).toBe('RECOVERING');

      const mission = await database.query<{ activeAttemptId: string | null; state: string }>(
        `select "active_external_attempt_id" as "activeAttemptId", "state"
         from "mcf_missions" where "id" = $1`,
        [missionId],
      );
      expect(mission.rows[0]).toEqual({ activeAttemptId: null, state: 'RECOVERING' });

      const attempt = await database.query<{ status: string; scopeKey: string | null }>(
        `select "status", "idempotency_scope_key" as "scopeKey"
         from "mcf_external_action_attempts" where "attempt_id" = $1`,
        [attemptId],
      );
      expect(attempt.rows[0]).toEqual({ status: 'UNKNOWN', scopeKey });

      const persistedReceipt = await database.query<{ validationStatus: string; status: string }>(
        `select "validation_status" as "validationStatus", "status"
         from "mcf_tool_receipts" where "receipt_id" = $1`,
        [receiptId],
      );
      expect(persistedReceipt.rows[0]).toEqual({ validationStatus: 'PENDING', status: 'PARTIAL' });
    } finally {
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_handoffs" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
