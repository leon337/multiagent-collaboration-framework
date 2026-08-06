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

  if (attempt) {
    await client.query(
      `update "mcf_external_action_attempts"
       set "status" = 'ABANDONED',
           "failure_code" = 'RESERVATION_EXPIRED',
           "failure_message" = 'External action reservation lease expired before mission persistence',
           "updated_at" = $1
       where "attempt_id" = $2`,
      [now, activeAttemptId],
    );
  }

  await client.query(
    `insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values ($1, $2, $3, $4, 'EXTERNAL_ACTION_ABANDONED', $5::jsonb, $6, $7)
    on conflict ("idempotency_key") do nothing`,
    [
      randomUUID(),
      missionId,
      attempt?.phaseId ?? null,
      attempt?.agentId ?? null,
      JSON.stringify({
        attemptId: activeAttemptId,
        previousStatus: attempt?.status ?? 'MISSING',
        reason: attempt ? 'RESERVATION_EXPIRED' : 'MISSING_LEDGER_ATTEMPT',
      }),
      `external-action:${activeAttemptId}:abandoned`,
      now,
    ],
  );

  await client.query(
    `update "mcf_missions"
     set "active_external_attempt_id" = null
     where "id" = $1 and "active_external_attempt_id" = $2`,
    [missionId, activeAttemptId],
  );

  return activeAttemptId;
}
