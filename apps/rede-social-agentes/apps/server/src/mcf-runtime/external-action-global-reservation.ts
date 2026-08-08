import { randomUUID } from 'node:crypto';

import type { DatabaseTransaction } from '@rsa/database';

interface ScopeCandidateRow {
  attemptId: string;
  missionId: string;
}

interface ScopeAttemptRow extends ScopeCandidateRow {
  status: string;
  leaseExpiresAt: Date;
  phaseId: string;
  agentId: string;
  idempotencyScopeKey: string | null;
}

export async function reconcileExpiredGlobalIdempotencyReservation(
  client: DatabaseTransaction,
  idempotencyScopeKey: string,
  now: Date = new Date(),
): Promise<string | null> {
  const candidateResult = await client.query<ScopeCandidateRow>(
    `select
       "attempt_id" as "attemptId",
       "mission_id" as "missionId"
     from "mcf_external_action_attempts"
     where "idempotency_scope_key" = $1
     limit 1`,
    [idempotencyScopeKey],
  );
  const candidate = candidateResult.rows[0];
  if (!candidate) return null;

  await client.query(
    `select "id"
     from "mcf_missions"
     where "id" = $1
     for update`,
    [candidate.missionId],
  );

  const attemptResult = await client.query<ScopeAttemptRow>(
    `select
       "attempt_id" as "attemptId",
       "mission_id" as "missionId",
       "status",
       "lease_expires_at" as "leaseExpiresAt",
       "phase_id" as "phaseId",
       "agent_id" as "agentId",
       "idempotency_scope_key" as "idempotencyScopeKey"
     from "mcf_external_action_attempts"
     where "attempt_id" = $1
     for update`,
    [candidate.attemptId],
  );
  const attempt = attemptResult.rows[0];
  if (
    !attempt ||
    attempt.idempotencyScopeKey !== idempotencyScopeKey ||
    attempt.status !== 'ALLOWED' ||
    attempt.leaseExpiresAt.getTime() > now.getTime()
  ) {
    return null;
  }

  await client.query(
    `update "mcf_external_action_attempts"
     set "status" = 'ABANDONED',
         "failure_code" = 'RESERVATION_EXPIRED',
         "failure_message" = 'Global external action reservation lease expired before mission persistence',
         "updated_at" = $1
     where "attempt_id" = $2
       and "status" = 'ALLOWED'
       and "idempotency_scope_key" = $3`,
    [now, attempt.attemptId, idempotencyScopeKey],
  );

  await client.query(
    `update "mcf_missions"
     set "active_external_attempt_id" = null
     where "id" = $1
       and "active_external_attempt_id" = $2`,
    [attempt.missionId, attempt.attemptId],
  );

  await client.query(
    `insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values ($1, $2, $3, $4, 'EXTERNAL_ACTION_ABANDONED', $5::jsonb, $6, $7)
    on conflict ("idempotency_key") do nothing`,
    [
      randomUUID(),
      attempt.missionId,
      attempt.phaseId,
      attempt.agentId,
      JSON.stringify({
        attemptId: attempt.attemptId,
        previousStatus: 'ALLOWED',
        reason: 'RESERVATION_EXPIRED',
        scope: 'GLOBAL_IDEMPOTENCY',
        idempotencyScopeKey,
      }),
      `external-action:${attempt.attemptId}:abandoned`,
      now,
    ],
  );

  return attempt.attemptId;
}
