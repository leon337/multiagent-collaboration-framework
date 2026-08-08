import { randomUUID } from 'node:crypto';

import type { DatabaseTransaction } from '@rsa/database';

export const EXTERNAL_ACTION_LEASE_MS = 10 * 60_000;

interface MissionReservationRow {
  activeExternalAttemptId: string | null;
}

interface AttemptReservationRow {
  status: string;
  leaseExpiresAt: Date;
  phaseId: string;
  agentId: string;
}

export async function reconcileExpiredExternalReservation(
  client: DatabaseTransaction,
  missionId: string,
  now: Date = new Date(),
): Promise<string | null> {
  await client.query(
    `select pg_advisory_xact_lock(hashtextextended('mcf:external-action:reservation-order', 0))`,
  );

  const mission = await client.query<MissionReservationRow>(
    `select "active_external_attempt_id" as "activeExternalAttemptId"
     from "mcf_missions"
     where "id" = $1
     for update`,
    [missionId],
  );
  const activeAttemptId = mission.rows[0]?.activeExternalAttemptId ?? null;
  if (!activeAttemptId) {
    return null;
  }

  const attemptResult = await client.query<AttemptReservationRow>(
    `select
       "status",
       "lease_expires_at" as "leaseExpiresAt",
       "phase_id" as "phaseId",
       "agent_id" as "agentId"
     from "mcf_external_action_attempts"
     where "attempt_id" = $1
     for update`,
    [activeAttemptId],
  );
  const attempt = attemptResult.rows[0];
  if (attempt && attempt.leaseExpiresAt.getTime() > now.getTime()) {
    return null;
  }

  const abandonedReservation = attempt?.status === 'ALLOWED';
  const ambiguousExecutingReservation = attempt?.status === 'EXECUTING';

  if (abandonedReservation) {
    await client.query(
      `update "mcf_external_action_attempts"
       set "status" = 'ABANDONED',
           "failure_code" = 'RESERVATION_EXPIRED',
           "failure_message" = 'External action reservation lease expired before mutation execution started',
           "updated_at" = $1
       where "attempt_id" = $2 and "status" = 'ALLOWED'`,
      [now, activeAttemptId],
    );
  }

  if (ambiguousExecutingReservation) {
    await client.query(
      `update "mcf_external_action_attempts"
       set "status" = 'UNKNOWN',
           "failure_code" = 'EXTERNAL_EFFECT_UNKNOWN',
           "failure_message" = 'External action execution lease expired after mutation execution was allowed to start; reconciliation is required before retry',
           "updated_at" = $1
       where "attempt_id" = $2 and "status" = 'EXECUTING'`,
      [now, activeAttemptId],
    );
  }

  if (abandonedReservation || ambiguousExecutingReservation || !attempt) {
    const eventType = ambiguousExecutingReservation
      ? 'EXTERNAL_ACTION_UNKNOWN'
      : 'EXTERNAL_ACTION_ABANDONED';
    const reason = ambiguousExecutingReservation
      ? 'EXECUTION_LEASE_EXPIRED_EFFECT_UNKNOWN'
      : attempt
        ? 'RESERVATION_EXPIRED'
        : 'MISSING_LEDGER_ATTEMPT';

    await client.query(
      `insert into "mcf_events" (
        "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
        "idempotency_key", "occurred_at"
      ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      on conflict ("idempotency_key") do nothing`,
      [
        randomUUID(),
        missionId,
        attempt?.phaseId ?? null,
        attempt?.agentId ?? null,
        eventType,
        JSON.stringify({
          attemptId: activeAttemptId,
          previousStatus: attempt?.status ?? 'MISSING',
          reason,
          retryWithoutReconciliation: false,
        }),
        ambiguousExecutingReservation
          ? `external-action:${activeAttemptId}:unknown`
          : `external-action:${activeAttemptId}:abandoned`,
        now,
      ],
    );
  }

  // A stale mission pointer may survive after the attempt reaches a terminal or
  // recoverable ledger state. ALLOWED can be abandoned because no external
  // execution started. EXECUTING is first converted to UNKNOWN so its durable
  // idempotency_scope_key remains consumed until explicit reconciliation.
  await client.query(
    `update "mcf_missions"
     set "active_external_attempt_id" = null
     where "id" = $1 and "active_external_attempt_id" = $2`,
    [missionId, activeAttemptId],
  );

  return activeAttemptId;
}
