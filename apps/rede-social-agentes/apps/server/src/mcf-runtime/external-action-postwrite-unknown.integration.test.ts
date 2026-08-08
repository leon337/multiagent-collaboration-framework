import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { reconcileExpiredExternalReservation } from './external-action-reservation.js';

describe('post-write UNKNOWN reservation recovery', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('converts an expired EXECUTING attempt to UNKNOWN without releasing its global binding', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const attemptId = randomUUID();
    const scopeKey = `github:repo/pr:comment-pr:${randomUUID()}`;
    const now = new Date();
    const expired = new Date(now.getTime() - 60_000);

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "active_external_attempt_id", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $4, $4)`,
        [
          missionId,
          JSON.stringify({
            title: 'Post-write ambiguity recovery',
            objective: 'Preserve a possibly consumed external idempotency key.',
            expectedOutcome: 'Expired executing attempt becomes unknown.',
            scope: ['runtime'],
            outOfScope: ['provider write'],
            acceptanceCriteria: ['binding preserved'],
            riskClass: 'B',
            selectedAgents: ['Gabriel'],
            selectedSkills: ['MCF-GIT-PR-RELEASE'],
            sourceOfTruth: ['MCF-RUNTIME-006-C2'],
          }),
          attemptId,
          now,
        ],
      );

      await database.query(
        `insert into "mcf_external_action_attempts" (
          "attempt_id", "mission_id", "phase_id", "agent_id", "skill_id",
          "adapter_id", "provider", "operation", "resource", "idempotency_key",
          "idempotency_fingerprint", "idempotency_scope_key", "expected_mission_version",
          "status", "lease_expires_at", "created_at", "updated_at"
        ) values ($1, $2, $3, 'Gabriel', 'MCF-GIT-PR-RELEASE',
          'github-pr-collaboration-write-v1', 'github', 'comment-pr',
          'leon337/multiagent-collaboration-framework', 'mcf-postwrite-unknown-0001',
          $4, $5, 1, 'EXECUTING', $6, $7, $7)`,
        [attemptId, missionId, phaseId, 'f'.repeat(64), scopeKey, expired, now],
      );

      await database.transaction(async (client) => {
        await reconcileExpiredExternalReservation(client, missionId, now);
      });

      const attempt = await database.query<{
        status: string;
        scopeKey: string | null;
        failureCode: string | null;
      }>(
        `select "status", "idempotency_scope_key" as "scopeKey", "failure_code" as "failureCode"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [attemptId],
      );
      expect(attempt.rows[0]).toEqual({
        status: 'UNKNOWN',
        scopeKey,
        failureCode: 'EXTERNAL_EFFECT_UNKNOWN',
      });

      const mission = await database.query<{ activeAttemptId: string | null }>(
        `select "active_external_attempt_id" as "activeAttemptId"
         from "mcf_missions" where "id" = $1`,
        [missionId],
      );
      expect(mission.rows[0]?.activeAttemptId).toBeNull();

      const unknownEvent = await database.query<{ count: string }>(
        `select count(*)::text as "count" from "mcf_events"
         where "mission_id" = $1 and "event_type" = 'EXTERNAL_ACTION_UNKNOWN'`,
        [missionId],
      );
      expect(unknownEvent.rows[0]?.count).toBe('1');
    } finally {
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
