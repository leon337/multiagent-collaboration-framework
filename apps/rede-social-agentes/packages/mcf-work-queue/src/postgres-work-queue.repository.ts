import { randomUUID } from 'node:crypto';

import type {
  McfClaimedWorkJob,
  McfWorkFailure,
  McfWorkGateDecision,
  McfWorkGateResponse,
  McfWorkJobListFilter,
  McfWorkJobResponse,
  McfWorkJobSpec,
  McfWorkJobStatus,
  McfWorkRecoverySummary,
  McfWorkResult,
} from '@rsa/contracts';
import {
  withTransaction,
  type DatabaseHandle,
  type DatabaseRow,
  type DatabaseTransaction,
} from '@rsa/database';

import { decideMcfWorkRetry } from './retry-policy.js';
import { computeMcfWorkSpecDigest, normalizeMcfWorkJobSpec } from './spec-digest.js';
import {
  McfWorkDispatchConflictError,
  McfWorkGateConflictError,
  McfWorkJobNotFoundError,
  McfWorkLeaseLostError,
  McfWorkStateConflictError,
} from './work-queue.errors.js';
import type { McfWorkQueueRepository } from './work-queue.repository.js';

interface JobRow extends DatabaseRow {
  id: string;
  dispatchId: string;
  specDigest: string;
  missionId: string | null;
  phaseId: string | null;
  agentId: string | null;
  gateRequired: boolean;
  priority: number;
  spec: unknown;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  leaseOwner: string | null;
  leaseToken: string | null;
  leaseExpiresAt: Date | null;
  heartbeatAt: Date | null;
  cancellationRequested: boolean;
  result: unknown;
  failure: unknown;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}

interface GateRow extends DatabaseRow {
  id: string;
  jobId: string;
  specDigest: string;
  state: string;
  decidedBy: string | null;
  reason: string | null;
  decidedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AttemptRow extends DatabaseRow {
  id: string;
  attemptNumber: number;
  leaseToken: string;
}

const jobColumns = `
  "id",
  "dispatch_id" as "dispatchId",
  "spec_digest" as "specDigest",
  "mission_id" as "missionId",
  "phase_id" as "phaseId",
  "agent_id" as "agentId",
  "gate_required" as "gateRequired",
  "priority",
  "spec",
  "status",
  "attempt_count" as "attemptCount",
  "max_attempts" as "maxAttempts",
  "next_attempt_at" as "nextAttemptAt",
  "lease_owner" as "leaseOwner",
  "lease_token" as "leaseToken",
  "lease_expires_at" as "leaseExpiresAt",
  "heartbeat_at" as "heartbeatAt",
  "cancellation_requested" as "cancellationRequested",
  "result",
  "failure",
  "created_at" as "createdAt",
  "updated_at" as "updatedAt",
  "finished_at" as "finishedAt"
`;

const gateColumns = `
  "id",
  "job_id" as "jobId",
  "spec_digest" as "specDigest",
  "state",
  "decided_by" as "decidedBy",
  "reason",
  "decided_at" as "decidedAt",
  "expires_at" as "expiresAt",
  "created_at" as "createdAt",
  "updated_at" as "updatedAt"
`;

function recordOrNull<T extends object>(value: unknown): T | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as T) : null;
}

function mapJob(row: JobRow): McfWorkJobResponse {
  const spec = recordOrNull<McfWorkJobSpec>(row.spec);
  if (!spec) throw new Error(`work job ${row.id} has an invalid persisted specification`);
  return {
    id: row.id,
    dispatchId: row.dispatchId,
    specDigest: row.specDigest,
    spec,
    missionId: row.missionId,
    phaseId: row.phaseId,
    agentId: row.agentId,
    status: row.status as McfWorkJobStatus,
    gateRequired: row.gateRequired,
    priority: row.priority,
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    nextAttemptAt: row.nextAttemptAt.toISOString(),
    leaseOwner: row.leaseOwner,
    leaseToken: row.leaseToken,
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    heartbeatAt: row.heartbeatAt?.toISOString() ?? null,
    cancellationRequested: row.cancellationRequested,
    result: recordOrNull<McfWorkResult>(row.result),
    failure: recordOrNull<McfWorkFailure>(row.failure),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}

function mapGate(row: GateRow): McfWorkGateResponse {
  return {
    id: row.id,
    jobId: row.jobId,
    specDigest: row.specDigest,
    state: row.state as McfWorkGateResponse['state'],
    decidedBy: row.decidedBy,
    reason: row.reason,
    decidedAt: row.decidedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function validateLeaseDuration(leaseDurationMs: number): void {
  if (!Number.isInteger(leaseDurationMs) || leaseDurationMs < 5_000 || leaseDurationMs > 3_600_000) {
    throw new Error('lease duration must be an integer between 5000 and 3600000 milliseconds');
  }
}

function validateNonEmpty(value: string, field: string, maximum = 512): string {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maximum || /\p{Cc}/u.test(normalized)) {
    throw new Error(`${field} is invalid`);
  }
  return normalized;
}

async function insertEvent(
  client: DatabaseTransaction,
  input: {
    jobId: string;
    attemptId?: string | null | undefined;
    eventType: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
    occurredAt: Date;
  },
): Promise<void> {
  await client.query(
    `insert into "mcf_work_events" (
       "id", "job_id", "attempt_id", "event_type", "payload", "idempotency_key", "occurred_at"
     ) values ($1, $2, $3, $4, $5::jsonb, $6, $7)
     on conflict ("idempotency_key") do nothing`,
    [
      randomUUID(),
      input.jobId,
      input.attemptId ?? null,
      input.eventType,
      JSON.stringify(input.payload),
      input.idempotencyKey,
      input.occurredAt,
    ],
  );
}

async function lockJob(client: DatabaseTransaction, jobId: string): Promise<JobRow> {
  const result = await client.query<JobRow>(
    `select ${jobColumns} from "mcf_work_jobs" where "id" = $1 for update`,
    [jobId],
  );
  const row = result.rows[0];
  if (!row) throw new McfWorkJobNotFoundError(jobId);
  return row;
}

async function activeAttempt(client: DatabaseTransaction, jobId: string, leaseToken: string): Promise<AttemptRow> {
  const result = await client.query<AttemptRow>(
    `select "id", "attempt_number" as "attemptNumber", "lease_token" as "leaseToken"
     from "mcf_work_attempts"
     where "job_id" = $1 and "lease_token" = $2 and "status" = 'RUNNING'
     for update`,
    [jobId, leaseToken],
  );
  const row = result.rows[0];
  if (!row) throw new McfWorkLeaseLostError(jobId);
  return row;
}

export class PostgresMcfWorkQueueRepository implements McfWorkQueueRepository {
  constructor(private readonly database: DatabaseHandle) {}

  async enqueue(spec: McfWorkJobSpec, now = new Date()): Promise<McfWorkJobResponse> {
    const normalized = normalizeMcfWorkJobSpec(spec);
    const digest = computeMcfWorkSpecDigest(normalized);
    return withTransaction(this.database, async (client) => {
      const jobId = randomUUID();
      const status = normalized.requiresGate ? 'WAITING_GATE' : 'QUEUED';
      const inserted = await client.query<JobRow>(
        `insert into "mcf_work_jobs" (
           "id", "dispatch_id", "spec_digest", "mission_id", "phase_id", "agent_id",
           "repository_key", "base_ref", "base_sha", "risk_class", "gate_required",
           "priority", "spec", "status", "max_attempts", "next_attempt_at", "created_at", "updated_at"
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $16, $16)
         on conflict ("dispatch_id") do nothing
         returning ${jobColumns}`,
        [
          jobId,
          normalized.dispatchId,
          digest,
          normalized.missionId ?? null,
          normalized.phaseId ?? null,
          normalized.agentId ?? null,
          normalized.repositoryKey,
          normalized.baseRef,
          normalized.expectedBaseSha,
          normalized.riskClass,
          normalized.requiresGate,
          normalized.priority,
          JSON.stringify(normalized),
          status,
          normalized.maxAttempts,
          now,
        ],
      );

      const created = inserted.rows[0];
      if (!created) {
        const existing = await client.query<JobRow>(
          `select ${jobColumns} from "mcf_work_jobs" where "dispatch_id" = $1 for update`,
          [normalized.dispatchId],
        );
        const row = existing.rows[0];
        if (!row) throw new Error('conflicting dispatch disappeared during enqueue');
        if (row.specDigest !== digest) throw new McfWorkDispatchConflictError(normalized.dispatchId);
        return mapJob(row);
      }

      if (normalized.requiresGate) {
        await client.query(
          `insert into "mcf_work_gates" (
             "id", "job_id", "spec_digest", "state", "created_at", "updated_at"
           ) values ($1, $2, $3, 'PENDING', $4, $4)`,
          [randomUUID(), created.id, digest, now],
        );
      }
      await insertEvent(client, {
        jobId: created.id,
        eventType: 'WORK_JOB_ENQUEUED',
        payload: { status, specDigest: digest, gateRequired: normalized.requiresGate },
        idempotencyKey: `work-job:${created.id}:enqueued`,
        occurredAt: now,
      });
      if (normalized.requiresGate) {
        await insertEvent(client, {
          jobId: created.id,
          eventType: 'WORK_GATE_REQUIRED',
          payload: { specDigest: digest, riskClass: normalized.riskClass },
          idempotencyKey: `work-job:${created.id}:gate-required:${digest}`,
          occurredAt: now,
        });
      }
      return mapJob(created);
    });
  }

  async get(jobId: string): Promise<McfWorkJobResponse | null> {
    const result = await this.database.pool.query<JobRow>(
      `select ${jobColumns} from "mcf_work_jobs" where "id" = $1`,
      [jobId],
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  }

  async list(filter: McfWorkJobListFilter = {}): Promise<McfWorkJobResponse[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filter.statuses && filter.statuses.length > 0) {
      values.push(filter.statuses);
      conditions.push(`"status" = any($${values.length}::text[])`);
    }
    if (filter.missionId) {
      values.push(filter.missionId);
      conditions.push(`"mission_id" = $${values.length}`);
    }
    if (filter.repositoryKey) {
      values.push(filter.repositoryKey);
      conditions.push(`"repository_key" = $${values.length}`);
    }
    const limit = filter.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('list limit must be between 1 and 500');
    values.push(limit);
    const result = await this.database.pool.query<JobRow>(
      `select ${jobColumns}
       from "mcf_work_jobs"
       ${conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''}
       order by "created_at" desc, "id" desc
       limit $${values.length}`,
      values,
    );
    return result.rows.map(mapJob);
  }

  async getGate(jobId: string): Promise<McfWorkGateResponse | null> {
    const result = await this.database.pool.query<GateRow>(
      `select ${gateColumns} from "mcf_work_gates" where "job_id" = $1 order by "created_at" desc limit 1`,
      [jobId],
    );
    return result.rows[0] ? mapGate(result.rows[0]) : null;
  }

  async decideGate(jobId: string, decision: McfWorkGateDecision, now = new Date()): Promise<McfWorkJobResponse> {
    const actor = validateNonEmpty(decision.actor, 'gate actor', 128);
    const reason = validateNonEmpty(decision.reason, 'gate reason', 2_000);
    if (!/^[a-f0-9]{64}$/u.test(decision.specDigest)) throw new McfWorkGateConflictError(jobId, 'invalid spec digest');
    const expiresAt = decision.expiresAt ? new Date(decision.expiresAt) : null;
    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now)) {
      throw new McfWorkGateConflictError(jobId, 'approval expiration must be in the future');
    }

    return withTransaction(this.database, async (client) => {
      const job = await lockJob(client, jobId);
      if (!job.gateRequired) throw new McfWorkGateConflictError(jobId, 'job does not require a gate');
      if (job.specDigest !== decision.specDigest) {
        throw new McfWorkGateConflictError(jobId, 'decision digest does not match the persisted job');
      }
      if (!['WAITING_GATE', 'QUEUED'].includes(job.status)) {
        throw new McfWorkGateConflictError(jobId, `job is already ${job.status}`);
      }
      const gateState = decision.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const updatedGate = await client.query<GateRow>(
        `update "mcf_work_gates"
         set "state" = $1, "decided_by" = $2, "reason" = $3, "decided_at" = $4,
             "expires_at" = $5, "updated_at" = $4
         where "job_id" = $6 and "spec_digest" = $7 and "state" in ('PENDING', 'EXPIRED')
         returning ${gateColumns}`,
        [gateState, actor, reason, now, decision.decision === 'APPROVE' ? expiresAt : null, jobId, decision.specDigest],
      );
      if (!updatedGate.rows[0]) throw new McfWorkGateConflictError(jobId, 'gate was already decided');

      const approved = decision.decision === 'APPROVE';
      const updatedJob = await client.query<JobRow>(
        `update "mcf_work_jobs"
         set "status" = $1, "failure" = $2::jsonb, "finished_at" = $3, "updated_at" = $4
         where "id" = $5
         returning ${jobColumns}`,
        [
          approved ? 'QUEUED' : 'CANCELLED',
          approved ? null : JSON.stringify({ code: 'GATE_REJECTED', message: reason, kind: 'POLICY', retryable: false }),
          approved ? null : now,
          now,
          jobId,
        ],
      );
      await insertEvent(client, {
        jobId,
        eventType: approved ? 'WORK_GATE_APPROVED' : 'WORK_GATE_REJECTED',
        payload: { actor, reason, specDigest: decision.specDigest, expiresAt: expiresAt?.toISOString() ?? null },
        idempotencyKey: `work-job:${jobId}:gate:${gateState.toLowerCase()}:${decision.specDigest}`,
        occurredAt: now,
      });
      return mapJob(updatedJob.rows[0]!);
    });
  }

  async claimNext(workerId: string, leaseDurationMs: number, now = new Date()): Promise<McfClaimedWorkJob | null> {
    const owner = validateNonEmpty(workerId, 'workerId', 128);
    validateLeaseDuration(leaseDurationMs);
    const leaseToken = randomUUID();
    const attemptId = randomUUID();
    const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs);
    return withTransaction(this.database, async (client) => {
      const claimed = await client.query<JobRow>(
        `with candidate as (
           select job."id"
           from "mcf_work_jobs" job
           where job."status" in ('QUEUED', 'RETRY_WAIT')
             and job."step_key" is null
             and job."next_attempt_at" <= $1
             and not job."cancellation_requested"
             and (
               not job."gate_required"
               or exists (
                 select 1 from "mcf_work_gates" gate
                 where gate."job_id" = job."id"
                   and gate."spec_digest" = job."spec_digest"
                   and gate."state" = 'APPROVED'
                   and (gate."expires_at" is null or gate."expires_at" > $1)
               )
             )
           order by job."priority" desc, job."next_attempt_at", job."created_at", job."id"
           for update skip locked
           limit 1
         )
         update "mcf_work_jobs" job
         set "status" = 'RUNNING', "attempt_count" = job."attempt_count" + 1,
             "lease_owner" = $2, "lease_token" = $3, "lease_expires_at" = $4,
             "heartbeat_at" = $1, "failure" = null, "updated_at" = $1
         from candidate
         where job."id" = candidate."id"
         returning ${jobColumns}`,
        [now, owner, leaseToken, leaseExpiresAt],
      );
      const row = claimed.rows[0];
      if (!row) return null;
      await client.query(
        `insert into "mcf_work_attempts" (
           "id", "job_id", "attempt_number", "worker_id", "lease_token", "status",
           "started_at", "heartbeat_at"
         ) values ($1, $2, $3, $4, $5, 'RUNNING', $6, $6)`,
        [attemptId, row.id, row.attemptCount, owner, leaseToken, now],
      );
      await insertEvent(client, {
        jobId: row.id,
        attemptId,
        eventType: 'WORK_JOB_CLAIMED',
        payload: { workerId: owner, attemptNumber: row.attemptCount, leaseExpiresAt: leaseExpiresAt.toISOString() },
        idempotencyKey: `work-job:${row.id}:attempt:${row.attemptCount}:claimed`,
        occurredAt: now,
      });
      return { job: mapJob(row), attemptId, attemptNumber: row.attemptCount, leaseToken };
    });
  }

  async heartbeat(jobId: string, leaseToken: string, leaseDurationMs: number, now = new Date()): Promise<McfWorkJobResponse> {
    validateLeaseDuration(leaseDurationMs);
    const expiresAt = new Date(now.getTime() + leaseDurationMs);
    return withTransaction(this.database, async (client) => {
      const updated = await client.query<JobRow>(
        `update "mcf_work_jobs"
         set "heartbeat_at" = $1, "lease_expires_at" = $2, "updated_at" = $1
         where "id" = $3 and "status" = 'RUNNING' and "lease_token" = $4 and "lease_expires_at" > $1
         returning ${jobColumns}`,
        [now, expiresAt, jobId, leaseToken],
      );
      if (!updated.rows[0]) throw new McfWorkLeaseLostError(jobId);
      await client.query(
        `update "mcf_work_attempts" set "heartbeat_at" = $1
         where "job_id" = $2 and "lease_token" = $3 and "status" = 'RUNNING'`,
        [now, jobId, leaseToken],
      );
      return mapJob(updated.rows[0]);
    });
  }

  async complete(jobId: string, leaseToken: string, result: McfWorkResult, now = new Date()): Promise<McfWorkJobResponse> {
    return withTransaction(this.database, async (client) => {
      const attempt = await activeAttempt(client, jobId, leaseToken);
      const updated = await client.query<JobRow>(
        `update "mcf_work_jobs"
         set "status" = 'SUCCEEDED', "result" = $1::jsonb, "failure" = null,
             "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
             "heartbeat_at" = null, "finished_at" = $2, "updated_at" = $2
         where "id" = $3 and "status" = 'RUNNING' and "lease_token" = $4
           and "lease_expires_at" > $2 and not "cancellation_requested"
         returning ${jobColumns}`,
        [JSON.stringify(result), now, jobId, leaseToken],
      );
      if (!updated.rows[0]) throw new McfWorkLeaseLostError(jobId);
      await client.query(
        `update "mcf_work_attempts" set "status" = 'SUCCEEDED', "result" = $1::jsonb,
             "heartbeat_at" = $2, "finished_at" = $2
         where "id" = $3 and "status" = 'RUNNING'`,
        [JSON.stringify(result), now, attempt.id],
      );
      await insertEvent(client, {
        jobId,
        attemptId: attempt.id,
        eventType: 'WORK_JOB_SUCCEEDED',
        payload: { attemptNumber: attempt.attemptNumber, patchDigest: result.patchDigest },
        idempotencyKey: `work-job:${jobId}:attempt:${attempt.attemptNumber}:succeeded`,
        occurredAt: now,
      });
      return mapJob(updated.rows[0]);
    });
  }

  async fail(jobId: string, leaseToken: string, failure: McfWorkFailure, now = new Date()): Promise<McfWorkJobResponse> {
    return withTransaction(this.database, async (client) => {
      const job = await lockJob(client, jobId);
      if (job.status !== 'RUNNING' || job.leaseToken !== leaseToken || !job.leaseExpiresAt || job.leaseExpiresAt <= now) {
        throw new McfWorkLeaseLostError(jobId);
      }
      const attempt = await activeAttempt(client, jobId, leaseToken);
      const decision = decideMcfWorkRetry({
        failure,
        attemptCount: job.attemptCount,
        maxAttempts: job.maxAttempts,
        now,
      });
      const terminal = decision.status === 'FAILED' || decision.status === 'DEAD';
      const updated = await client.query<JobRow>(
        `update "mcf_work_jobs"
         set "status" = $1, "failure" = $2::jsonb, "next_attempt_at" = $3,
             "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
             "heartbeat_at" = null, "finished_at" = $4, "updated_at" = $5
         where "id" = $6
         returning ${jobColumns}`,
        [decision.status, JSON.stringify(failure), decision.nextAttemptAt ?? now, terminal ? now : null, now, jobId],
      );
      await client.query(
        `update "mcf_work_attempts" set "status" = 'FAILED', "failure" = $1::jsonb,
             "heartbeat_at" = $2, "finished_at" = $2
         where "id" = $3 and "status" = 'RUNNING'`,
        [JSON.stringify(failure), now, attempt.id],
      );
      await insertEvent(client, {
        jobId,
        attemptId: attempt.id,
        eventType: decision.status === 'RETRY_WAIT' ? 'WORK_JOB_RETRY_SCHEDULED' : 'WORK_JOB_FAILED',
        payload: { attemptNumber: attempt.attemptNumber, status: decision.status, code: failure.code },
        idempotencyKey: `work-job:${jobId}:attempt:${attempt.attemptNumber}:${decision.status.toLowerCase()}`,
        occurredAt: now,
      });
      return mapJob(updated.rows[0]!);
    });
  }

  async blockAuth(jobId: string, leaseToken: string, failure: McfWorkFailure, now = new Date()): Promise<McfWorkJobResponse> {
    if (failure.kind !== 'AUTH') throw new McfWorkStateConflictError(jobId, 'blockAuth requires an AUTH failure');
    return withTransaction(this.database, async (client) => {
      const attempt = await activeAttempt(client, jobId, leaseToken);
      const updated = await client.query<JobRow>(
        `update "mcf_work_jobs"
         set "status" = 'BLOCKED_AUTH', "failure" = $1::jsonb,
             "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
             "heartbeat_at" = null, "updated_at" = $2
         where "id" = $3 and "status" = 'RUNNING' and "lease_token" = $4 and "lease_expires_at" > $2
         returning ${jobColumns}`,
        [JSON.stringify(failure), now, jobId, leaseToken],
      );
      if (!updated.rows[0]) throw new McfWorkLeaseLostError(jobId);
      await client.query(
        `update "mcf_work_attempts" set "status" = 'FAILED', "failure" = $1::jsonb,
             "heartbeat_at" = $2, "finished_at" = $2
         where "id" = $3 and "status" = 'RUNNING'`,
        [JSON.stringify(failure), now, attempt.id],
      );
      await insertEvent(client, {
        jobId,
        attemptId: attempt.id,
        eventType: 'WORK_JOB_BLOCKED_AUTH',
        payload: { attemptNumber: attempt.attemptNumber, code: failure.code },
        idempotencyKey: `work-job:${jobId}:attempt:${attempt.attemptNumber}:blocked-auth`,
        occurredAt: now,
      });
      return mapJob(updated.rows[0]);
    });
  }

  async recover(now = new Date()): Promise<McfWorkRecoverySummary> {
    return withTransaction(this.database, async (client) => {
      const expiredGates = await client.query<{ jobId: string } & DatabaseRow>(
        `update "mcf_work_gates"
         set "state" = 'EXPIRED', "decided_by" = 'SYSTEM',
             "reason" = 'Approved gate expired before claim', "decided_at" = $1, "updated_at" = $1
         where "state" = 'APPROVED' and "expires_at" is not null and "expires_at" <= $1
         returning "job_id" as "jobId"`,
        [now],
      );
      for (const gate of expiredGates.rows) {
        await client.query(
          `update "mcf_work_jobs" set "status" = 'WAITING_GATE', "updated_at" = $1
           where "id" = $2 and "status" in ('QUEUED', 'RETRY_WAIT')`,
          [now, gate.jobId],
        );
        await insertEvent(client, {
          jobId: gate.jobId,
          eventType: 'WORK_GATE_EXPIRED',
          payload: {},
          idempotencyKey: `work-job:${gate.jobId}:gate-expired:${now.toISOString()}`,
          occurredAt: now,
        });
      }

      const expired = await client.query<JobRow>(
        `select ${jobColumns} from "mcf_work_jobs"
         where "status" = 'RUNNING' and "step_key" is null and "lease_expires_at" <= $1
         order by "lease_expires_at", "id"
         for update skip locked`,
        [now],
      );
      let recoveredForRetry = 0;
      let movedToDead = 0;
      for (const job of expired.rows) {
        const retry = job.attemptCount < job.maxAttempts;
        const status = retry ? 'RETRY_WAIT' : 'DEAD';
        const failure: McfWorkFailure = {
          code: 'WORKER_LEASE_EXPIRED',
          message: 'Worker lease expired before a terminal result was persisted.',
          kind: 'TRANSIENT',
          retryable: retry,
        };
        const attempt = await activeAttempt(client, job.id, job.leaseToken!);
        await client.query(
          `update "mcf_work_attempts" set "status" = 'ABANDONED', "failure" = $1::jsonb,
               "heartbeat_at" = $2, "finished_at" = $2
           where "id" = $3 and "status" = 'RUNNING'`,
          [JSON.stringify(failure), now, attempt.id],
        );
        await client.query(
          `update "mcf_work_jobs"
           set "status" = $1, "failure" = $2::jsonb, "next_attempt_at" = $3,
               "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
               "heartbeat_at" = null, "finished_at" = $4, "updated_at" = $3
           where "id" = $5`,
          [status, JSON.stringify(failure), now, retry ? null : now, job.id],
        );
        await insertEvent(client, {
          jobId: job.id,
          attemptId: attempt.id,
          eventType: retry ? 'WORK_LEASE_EXPIRED_RETRY' : 'WORK_LEASE_EXPIRED_DEAD',
          payload: { attemptNumber: attempt.attemptNumber },
          idempotencyKey: `work-job:${job.id}:attempt:${attempt.attemptNumber}:lease-expired`,
          occurredAt: now,
        });
        if (retry) recoveredForRetry += 1;
        else movedToDead += 1;
      }
      return { recoveredForRetry, movedToDead, expiredGates: expiredGates.rowCount ?? 0 };
    });
  }

  async resumeBlockedAuth(now = new Date()): Promise<number> {
    const result = await this.database.pool.query(
      `update "mcf_work_jobs"
       set "status" = 'RETRY_WAIT', "next_attempt_at" = $1, "updated_at" = $1
       where "status" = 'BLOCKED_AUTH' and "step_key" is null`,
      [now],
    );
    return result.rowCount ?? 0;
  }

  async cancel(jobId: string, actor: string, reason: string, now = new Date()): Promise<McfWorkJobResponse> {
    const normalizedActor = validateNonEmpty(actor, 'cancellation actor', 128);
    const normalizedReason = validateNonEmpty(reason, 'cancellation reason', 2_000);
    return withTransaction(this.database, async (client) => {
      const job = await lockJob(client, jobId);
      if (['SUCCEEDED', 'FAILED', 'DEAD', 'CANCELLED'].includes(job.status)) return mapJob(job);
      const running = job.status === 'RUNNING';
      const updated = await client.query<JobRow>(
        `update "mcf_work_jobs"
         set "status" = $1, "cancellation_requested" = true,
             "failure" = $2::jsonb, "finished_at" = $3, "updated_at" = $4
         where "id" = $5
         returning ${jobColumns}`,
        [
          running ? 'RUNNING' : 'CANCELLED',
          JSON.stringify({ code: 'CANCEL_REQUESTED', message: normalizedReason, kind: 'POLICY', retryable: false }),
          running ? null : now,
          now,
          jobId,
        ],
      );
      await insertEvent(client, {
        jobId,
        eventType: running ? 'WORK_CANCELLATION_REQUESTED' : 'WORK_JOB_CANCELLED',
        payload: { actor: normalizedActor, reason: normalizedReason },
        idempotencyKey: `work-job:${jobId}:cancel:${job.attemptCount}`,
        occurredAt: now,
      });
      return mapJob(updated.rows[0]!);
    });
  }
}
