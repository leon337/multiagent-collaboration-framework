import { randomUUID } from 'node:crypto';
import { isAbsolute, normalize, relative, sep } from 'node:path';

import type {
  McfActiveMissionFilter,
  McfBegunMissionStep,
  McfBeginMissionStepInput,
  McfBindMissionWorktreeInput,
  McfCompletedMissionStep,
  McfCompleteMissionStepInput,
  McfContinuityMissionClaim,
  McfContinuityMissionResponse,
  McfContinuityMissionSpec,
  McfContinuityMissionStatus,
  McfContinuityStepResponse,
  McfContinueMissionInput,
  McfFailMissionStepInput,
  McfMissionArtifactInput,
  McfMissionArtifactResponse,
  McfMissionCheckpointInput,
  McfMissionCheckpointResponse,
  McfMissionEventQuery,
  McfMissionHeartbeatInput,
  McfMissionRecoverySummary,
  McfMissionWorkEventResponse,
  McfWorkFailure,
  McfWorkJobSpec,
  McfWorkJobStatus,
  McfWorkResult,
} from '@rsa/contracts';
import {
  withTransaction,
  type DatabaseHandle,
  type DatabaseRow,
  type DatabaseTransaction,
} from '@rsa/database';

import { decideMcfWorkRetry } from './retry-policy.js';
import {
  computeMcfContinuityMissionSpecDigest,
  normalizeMcfContinuityMissionSpec,
  type NormalizedMcfContinuityMissionSpec,
  type NormalizedMcfContinuityStepSpec,
} from './mission-continuity-spec.js';
import {
  McfContinuityMissionConflictError,
  McfContinuityMissionLeaseLostError,
  McfContinuityMissionNotFoundError,
  McfWorkDispatchConflictError,
} from './work-queue.errors.js';
import type { McfMissionContinuityRepository } from './mission-continuity.repository.js';

interface MissionRow extends DatabaseRow {
  id: string;
  dispatchId: string;
  specDigest: string;
  spec: unknown;
  projectKey: string;
  repositoryKey: string;
  status: string;
  stateVersion: number;
  fencingToken: number;
  currentStepKey: string | null;
  completedStepCount: number;
  totalStepCount: number;
  worktreePath: string | null;
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

interface StepRow extends DatabaseRow {
  jobId: string;
  stepKey: string;
  stepOrder: number;
  dependsOnStepKeys: unknown;
  status: string;
  stateVersion: number;
  attemptCount: number;
  maxAttempts: number;
  result: unknown;
  failure: unknown;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
}

interface AttemptRow extends DatabaseRow {
  id: string;
  attemptNumber: number;
}

interface CheckpointRow extends DatabaseRow {
  id: string;
  sequence: string;
  missionId: string;
  jobId: string;
  stepKey: string;
  attemptNumber: number;
  stateVersion: number;
  fencingToken: number;
  checkpoint: unknown;
  result: unknown;
  createdAt: Date;
}

interface ArtifactRow extends DatabaseRow {
  id: string;
  missionId: string;
  jobId: string | null;
  checkpointId: string | null;
  artifactKey: string;
  kind: string;
  relativePath: string;
  sha256: string;
  sizeBytes: string;
  mediaType: string;
  metadata: unknown;
  createdAt: Date;
}

interface EventRow extends DatabaseRow {
  id: string;
  sequence: string;
  missionId: string;
  jobId: string | null;
  attemptId: string | null;
  eventType: string;
  payload: unknown;
  idempotencyKey: string;
  occurredAt: Date;
}

const missionColumns = `
  continuity."mission_id" as "id",
  continuity."dispatch_id" as "dispatchId",
  continuity."spec_digest" as "specDigest",
  continuity."spec",
  continuity."project_key" as "projectKey",
  continuity."repository_key" as "repositoryKey",
  continuity."status",
  mission."version" as "stateVersion",
  continuity."fencing_token" as "fencingToken",
  continuity."current_step_key" as "currentStepKey",
  continuity."completed_step_count" as "completedStepCount",
  continuity."total_step_count" as "totalStepCount",
  continuity."worktree_path" as "worktreePath",
  continuity."lease_owner" as "leaseOwner",
  continuity."lease_token" as "leaseToken",
  continuity."lease_expires_at" as "leaseExpiresAt",
  continuity."heartbeat_at" as "heartbeatAt",
  continuity."cancellation_requested" as "cancellationRequested",
  continuity."result",
  continuity."failure",
  continuity."created_at" as "createdAt",
  continuity."updated_at" as "updatedAt",
  continuity."finished_at" as "finishedAt"
`;

const stepColumns = `
  "id" as "jobId",
  "step_key" as "stepKey",
  "step_order" as "stepOrder",
  "depends_on_step_keys" as "dependsOnStepKeys",
  "status",
  "state_version" as "stateVersion",
  "attempt_count" as "attemptCount",
  "max_attempts" as "maxAttempts",
  "result",
  "failure",
  "created_at" as "createdAt",
  "updated_at" as "updatedAt",
  "finished_at" as "finishedAt"
`;

function recordOrNull<T extends object>(value: unknown): T | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : null;
}

function record<T extends object>(value: unknown, context: string): T {
  const parsed = recordOrNull<T>(value);
  if (!parsed) throw new Error(`${context} contains invalid persisted JSON`);
  return parsed;
}

function stringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${context} contains invalid persisted JSON`);
  }
  return value as string[];
}

function mapStep(row: StepRow): McfContinuityStepResponse {
  return {
    jobId: row.jobId,
    stepKey: row.stepKey,
    stepOrder: row.stepOrder,
    dependsOnStepKeys: stringArray(row.dependsOnStepKeys, `mission step ${row.jobId}`),
    status: row.status as McfWorkJobStatus,
    stateVersion: row.stateVersion,
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    result: recordOrNull<McfWorkResult>(row.result),
    failure: recordOrNull<McfWorkFailure>(row.failure),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}

function mapMission(row: MissionRow, steps: StepRow[]): McfContinuityMissionResponse {
  return {
    id: row.id,
    dispatchId: row.dispatchId,
    specDigest: row.specDigest,
    spec: record<McfContinuityMissionSpec>(row.spec, `continuity mission ${row.id}`),
    projectKey: row.projectKey,
    repositoryKey: row.repositoryKey,
    status: row.status as McfContinuityMissionStatus,
    stateVersion: row.stateVersion,
    fencingToken: row.fencingToken,
    currentStepKey: row.currentStepKey,
    completedStepCount: row.completedStepCount,
    totalStepCount: row.totalStepCount,
    worktreePath: row.worktreePath,
    leaseOwner: row.leaseOwner,
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    heartbeatAt: row.heartbeatAt?.toISOString() ?? null,
    cancellationRequested: row.cancellationRequested,
    result: recordOrNull<McfWorkResult>(row.result),
    failure: recordOrNull<McfWorkFailure>(row.failure),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    steps: steps.map(mapStep),
  };
}

function validateLeaseDuration(value: number): void {
  if (!Number.isInteger(value) || value < 5_000 || value > 3_600_000) {
    throw new Error('lease duration must be an integer between 5000 and 3600000 milliseconds');
  }
}

function nonEmpty(value: string, field: string, maximum = 512): string {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maximum || /\p{Cc}/u.test(normalized)) {
    throw new Error(`${field} is invalid`);
  }
  return normalized;
}

function validateVersion(value: number): void {
  if (!Number.isInteger(value) || value < 1) throw new Error('expectedStateVersion is invalid');
}

function validateFencingToken(value: number): void {
  if (!Number.isInteger(value) || value < 1) throw new Error('fencingToken is invalid');
}

function validateWorktreePath(value: string): string {
  const candidate = nonEmpty(value, 'worktreePath', 4_096);
  if (!isAbsolute(candidate) || normalize(candidate) !== candidate || candidate.split(sep).includes('..')) {
    throw new Error('worktreePath must be an absolute normalized path');
  }
  return candidate;
}

function validateRelativeArtifactPath(value: string): string {
  const candidate = nonEmpty(value, 'artifact relativePath', 4_096);
  const normalized = normalize(candidate);
  if (isAbsolute(candidate) || normalized === '..' || normalized.startsWith(`..${sep}`) || normalized !== candidate) {
    throw new Error('artifact relativePath must remain inside the mission artifact root');
  }
  return candidate;
}

function validateArtifact(input: McfMissionArtifactInput): McfMissionArtifactInput {
  if (!/^[a-f0-9]{64}$/u.test(input.sha256)) throw new Error('artifact sha256 is invalid');
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 0) throw new Error('artifact sizeBytes is invalid');
  return {
    artifactKey: nonEmpty(input.artifactKey, 'artifactKey', 256),
    kind: nonEmpty(input.kind, 'artifact kind', 128),
    relativePath: validateRelativeArtifactPath(input.relativePath),
    sha256: input.sha256,
    sizeBytes: input.sizeBytes,
    mediaType: nonEmpty(input.mediaType, 'artifact mediaType', 256),
    ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
  };
}

function validateCheckpoint(input: McfMissionCheckpointInput): McfMissionCheckpointInput {
  if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u.test(input.repositoryState.baseSha)) {
    throw new Error('checkpoint baseSha is invalid');
  }
  if (input.repositoryState.headSha !== null && !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u.test(input.repositoryState.headSha)) {
    throw new Error('checkpoint headSha is invalid');
  }
  if (input.repositoryState.patchDigest !== null && !/^[a-f0-9]{64}$/u.test(input.repositoryState.patchDigest)) {
    throw new Error('checkpoint patchDigest is invalid');
  }
  return {
    checkpointKey: nonEmpty(input.checkpointKey, 'checkpointKey', 256),
    summary: nonEmpty(input.summary, 'checkpoint summary', 8_000),
    completedAcceptanceCriteria: input.completedAcceptanceCriteria.map((criterion) =>
      nonEmpty(criterion, 'completed acceptance criterion', 1_000),
    ),
    nextAction: input.nextAction === null ? null : nonEmpty(input.nextAction, 'nextAction', 4_000),
    repositoryState: {
      ...input.repositoryState,
      worktreePath: validateWorktreePath(input.repositoryState.worktreePath),
    },
    ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
  };
}

async function insertWorkEvent(
  client: DatabaseTransaction,
  input: {
    missionId: string;
    jobId?: string | null | undefined;
    attemptId?: string | null | undefined;
    eventType: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
    occurredAt: Date;
  },
): Promise<void> {
  await client.query(
    `insert into "mcf_work_events" (
       "id", "mission_id", "job_id", "attempt_id", "event_type", "payload",
       "idempotency_key", "occurred_at"
     ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     on conflict ("idempotency_key") do nothing`,
    [
      randomUUID(),
      input.missionId,
      input.jobId ?? null,
      input.attemptId ?? null,
      input.eventType,
      JSON.stringify(input.payload),
      input.idempotencyKey,
      input.occurredAt,
    ],
  );
}

async function loadMission(
  client: DatabaseTransaction,
  missionId: string,
  lock = false,
): Promise<{ row: MissionRow; response: McfContinuityMissionResponse } | null> {
  const missionResult = await client.query<MissionRow>(
    `select ${missionColumns}
     from "mcf_mission_continuity" continuity
     join "mcf_missions" mission on mission."id" = continuity."mission_id"
     where continuity."mission_id" = $1
     ${lock ? 'for update of continuity, mission' : ''}`,
    [missionId],
  );
  const row = missionResult.rows[0];
  if (!row) return null;
  const steps = await client.query<StepRow>(
    `select ${stepColumns}
     from "mcf_work_jobs"
     where "mission_id" = $1 and "step_key" is not null
     order by "step_order", "id"`,
    [missionId],
  );
  return { row, response: mapMission(row, steps.rows) };
}

async function requireMission(
  client: DatabaseTransaction,
  missionId: string,
  lock = true,
): Promise<{ row: MissionRow; response: McfContinuityMissionResponse }> {
  const mission = await loadMission(client, missionId, lock);
  if (!mission) throw new McfContinuityMissionNotFoundError(missionId);
  return mission;
}

function requireLease(
  row: MissionRow,
  input: { leaseToken: string; fencingToken: number; expectedStateVersion?: number | undefined },
  now: Date,
): void {
  validateFencingToken(input.fencingToken);
  if (
    row.status !== 'RUNNING' ||
    row.leaseToken !== input.leaseToken ||
    row.fencingToken !== input.fencingToken ||
    !row.leaseExpiresAt ||
    row.leaseExpiresAt <= now
  ) {
    throw new McfContinuityMissionLeaseLostError(row.id);
  }
  if (input.expectedStateVersion !== undefined && row.stateVersion !== input.expectedStateVersion) {
    throw new McfContinuityMissionConflictError(
      row.id,
      `expected state version ${input.expectedStateVersion}, found ${row.stateVersion}`,
    );
  }
}

function runtimeContract(spec: NormalizedMcfContinuityMissionSpec): Record<string, unknown> {
  return {
    contractSchemaVersion: '1.1',
    projectId: spec.projectKey,
    title: spec.title,
    objective: spec.objective,
    expectedOutcome: spec.acceptanceCriteria.join('; '),
    scope: [spec.repositoryKey, spec.writeScopeProfile],
    outOfScope: ['arbitrary-shell', 'generic-sudo', 'credential-export'],
    acceptanceCriteria: spec.acceptanceCriteria,
    riskClass: spec.riskClass,
    selectedAgents: spec.agentId ? [spec.agentId] : ['MESTRE'],
    selectedSkills: ['MCF-IMPLEMENT-CHANGE', 'MCF-RUN-TESTS', 'MCF-RECOVER-CONTEXT'],
    sourceOfTruth: [
      'mcf_missions',
      'mcf_mission_continuity',
      'mcf_work_jobs',
      'mcf_mission_checkpoints',
      'mcf_work_events',
    ],
    continuityDispatchId: spec.dispatchId,
  };
}

function workSpec(
  missionId: string,
  mission: NormalizedMcfContinuityMissionSpec,
  step: NormalizedMcfContinuityStepSpec,
  stepOrder: number,
): McfWorkJobSpec {
  return {
    dispatchId: `${missionId}:${stepOrder}`,
    objective: step.objective,
    acceptanceCriteria: step.acceptanceCriteria,
    repositoryKey: mission.repositoryKey,
    baseRef: mission.baseRef,
    expectedBaseSha: mission.expectedBaseSha,
    riskClass: step.riskClass,
    writeScopeProfile: step.writeScopeProfile,
    verificationProfiles: step.verificationProfiles,
    missionId,
    ...(step.agentId === undefined ? {} : { agentId: step.agentId }),
    requiresGate: step.requiresGate,
    priority: mission.priority,
    maxAttempts: step.maxAttempts,
  };
}

export class PostgresMcfMissionContinuityRepository implements McfMissionContinuityRepository {
  constructor(private readonly database: DatabaseHandle) {}

  async createMission(
    spec: McfContinuityMissionSpec,
    now = new Date(),
  ): Promise<McfContinuityMissionResponse> {
    const normalized = normalizeMcfContinuityMissionSpec(spec);
    const digest = computeMcfContinuityMissionSpecDigest(normalized);
    return withTransaction(this.database, async (client) => {
      const existing = await client.query<{ missionId: string; specDigest: string } & DatabaseRow>(
        `select "mission_id" as "missionId", "spec_digest" as "specDigest"
         from "mcf_mission_continuity" where "dispatch_id" = $1 for update`,
        [normalized.dispatchId],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].specDigest !== digest) {
          throw new McfWorkDispatchConflictError(normalized.dispatchId);
        }
        return (await requireMission(client, existing.rows[0].missionId, false)).response;
      }

      const missionId = randomUUID();
      const rootSteps = normalized.steps.filter((step) => step.dependsOn.length === 0);
      const waitingGate = rootSteps.every((step) => step.requiresGate);
      const continuityStatus: McfContinuityMissionStatus = waitingGate ? 'WAITING_GATE' : 'QUEUED';
      await client.query(
        `insert into "mcf_missions" (
           "id", "contract", "state", "version", "created_at", "updated_at"
         ) values ($1, $2::jsonb, $3, 1, $4, $4)`,
        [missionId, JSON.stringify(runtimeContract(normalized)), waitingGate ? 'BLOCKED_RISK' : 'PLANNED', now],
      );
      await client.query(
        `insert into "mcf_mission_continuity" (
           "mission_id", "dispatch_id", "spec_digest", "project_key", "repository_key",
           "priority", "spec", "status", "total_step_count", "created_at", "updated_at"
         ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $10)`,
        [
          missionId,
          normalized.dispatchId,
          digest,
          normalized.projectKey,
          normalized.repositoryKey,
          normalized.priority,
          JSON.stringify(normalized),
          continuityStatus,
          normalized.steps.length,
          now,
        ],
      );

      for (const [index, step] of normalized.steps.entries()) {
        const stepOrder = index + 1;
        const jobId = randomUUID();
        const jobSpec = workSpec(missionId, normalized, step, stepOrder);
        const jobStatus = step.requiresGate ? 'WAITING_GATE' : 'QUEUED';
        await client.query(
          `insert into "mcf_work_jobs" (
             "id", "dispatch_id", "spec_digest", "mission_id", "agent_id",
             "repository_key", "base_ref", "base_sha", "risk_class", "gate_required",
             "priority", "spec", "status", "max_attempts", "next_attempt_at",
             "step_key", "step_order", "depends_on_step_keys", "state_version",
             "created_at", "updated_at"
           ) values (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
             $11, $12::jsonb, $13, $14, $15, $16, $17, $18::jsonb, 1, $15, $15
           )`,
          [
            jobId,
            jobSpec.dispatchId,
            computeMcfContinuityMissionSpecDigest({ ...normalized, steps: [step] }),
            missionId,
            step.agentId ?? null,
            normalized.repositoryKey,
            normalized.baseRef,
            normalized.expectedBaseSha,
            step.riskClass,
            step.requiresGate,
            normalized.priority,
            JSON.stringify(jobSpec),
            jobStatus,
            step.maxAttempts,
            now,
            step.stepKey,
            stepOrder,
            JSON.stringify(step.dependsOn),
          ],
        );
        if (step.requiresGate) {
          await client.query(
            `insert into "mcf_work_gates" (
               "id", "job_id", "spec_digest", "state", "created_at", "updated_at"
             ) values ($1, $2, $3, 'PENDING', $4, $4)`,
            [randomUUID(), jobId, computeMcfContinuityMissionSpecDigest({ ...normalized, steps: [step] }), now],
          );
        }
      }

      await client.query(
        `insert into "mcf_events" (
           "id", "mission_id", "event_type", "payload", "idempotency_key", "occurred_at"
         ) values ($1, $2, 'MISSION_CREATED', $3::jsonb, $4, $5)
         on conflict ("idempotency_key") do nothing`,
        [randomUUID(), missionId, JSON.stringify({ continuity: true, dispatchId: normalized.dispatchId }), `continuity:${missionId}:created`, now],
      );
      await insertWorkEvent(client, {
        missionId,
        eventType: 'MISSION_CONTINUITY_CREATED',
        payload: { dispatchId: normalized.dispatchId, specDigest: digest, status: continuityStatus },
        idempotencyKey: `continuity:${missionId}:created`,
        occurredAt: now,
      });
      return (await requireMission(client, missionId, false)).response;
    });
  }

  async getMission(missionId: string): Promise<McfContinuityMissionResponse | null> {
    return withTransaction(this.database, async (client) => (await loadMission(client, missionId))?.response ?? null);
  }

  async discoverActive(filter: McfActiveMissionFilter = {}): Promise<McfContinuityMissionResponse[]> {
    const conditions = [`"status" not in ('SUCCEEDED', 'FAILED', 'CANCELLED')`];
    const values: unknown[] = [];
    if (filter.projectKey) {
      values.push(nonEmpty(filter.projectKey, 'projectKey', 128));
      conditions.push(`"project_key" = $${values.length}`);
    }
    if (filter.repositoryKey) {
      values.push(nonEmpty(filter.repositoryKey, 'repositoryKey', 128));
      conditions.push(`"repository_key" = $${values.length}`);
    }
    const limit = filter.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('active mission limit is invalid');
    values.push(limit);
    const ids = await this.database.pool.query<{ missionId: string } & DatabaseRow>(
      `select "mission_id" as "missionId" from "mcf_mission_continuity"
       where ${conditions.join(' and ')}
       order by "updated_at" desc, "mission_id" desc limit $${values.length}`,
      values,
    );
    return withTransaction(this.database, async (client) => {
      const missions: McfContinuityMissionResponse[] = [];
      for (const { missionId } of ids.rows) {
        const mission = await loadMission(client, missionId);
        if (mission) missions.push(mission.response);
      }
      return missions;
    });
  }

  async claimRunnableMission(
    workerId: string,
    leaseDurationMs: number,
    now = new Date(),
  ): Promise<McfContinuityMissionClaim | null> {
    const owner = nonEmpty(workerId, 'workerId', 128);
    validateLeaseDuration(leaseDurationMs);
    const leaseToken = randomUUID();
    const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs);
    return withTransaction(this.database, async (client) => {
      const candidate = await client.query<{ missionId: string; repositoryKey: string } & DatabaseRow>(
        `select continuity."mission_id" as "missionId", continuity."repository_key" as "repositoryKey"
         from "mcf_mission_continuity" continuity
         where continuity."status" in ('QUEUED', 'RETRY_WAIT')
           and not continuity."cancellation_requested"
           and exists (
             select 1 from "mcf_work_jobs" step
             where step."mission_id" = continuity."mission_id"
               and step."step_key" is not null
               and step."status" in ('QUEUED', 'RETRY_WAIT')
               and step."next_attempt_at" <= $1
               and not exists (
                 select 1
                 from jsonb_array_elements_text(step."depends_on_step_keys") dependency("step_key")
                 where not exists (
                   select 1 from "mcf_work_jobs" completed
                   where completed."mission_id" = continuity."mission_id"
                     and completed."step_key" = dependency."step_key"
                     and completed."status" = 'SUCCEEDED'
                 )
               )
               and (
                 not step."gate_required" or exists (
                   select 1 from "mcf_work_gates" gate
                   where gate."job_id" = step."id" and gate."spec_digest" = step."spec_digest"
                     and gate."state" = 'APPROVED'
                     and (gate."expires_at" is null or gate."expires_at" > $1)
                 )
               )
           )
           and not exists (
             select 1 from "mcf_mission_continuity" active
             where active."repository_key" = continuity."repository_key"
               and active."mission_id" <> continuity."mission_id"
               and active."status" = 'RUNNING' and active."lease_expires_at" > $1
           )
         order by continuity."priority" desc, continuity."created_at", continuity."mission_id"
         for update skip locked limit 1`,
        [now],
      );
      const selected = candidate.rows[0];
      if (!selected) return null;
      const advisory = await client.query<{ acquired: boolean } & DatabaseRow>(
        `select pg_try_advisory_xact_lock(hashtextextended($1, 0)) as "acquired"`,
        [selected.repositoryKey],
      );
      if (!advisory.rows[0]?.acquired) return null;
      const competing = await client.query(
        `select 1 from "mcf_mission_continuity"
         where "repository_key" = $1 and "mission_id" <> $2
           and "status" = 'RUNNING' and "lease_expires_at" > $3 limit 1`,
        [selected.repositoryKey, selected.missionId, now],
      );
      if (competing.rowCount) return null;

      const updated = await client.query<{ fencingToken: number } & DatabaseRow>(
        `update "mcf_mission_continuity"
         set "status" = 'RUNNING', "fencing_token" = "fencing_token" + 1,
             "lease_owner" = $1, "lease_token" = $2, "lease_expires_at" = $3,
             "heartbeat_at" = $4, "failure" = null, "updated_at" = $4
         where "mission_id" = $5 and "status" in ('QUEUED', 'RETRY_WAIT')
         returning "fencing_token" as "fencingToken"`,
        [owner, leaseToken, leaseExpiresAt, now, selected.missionId],
      );
      const fencingToken = updated.rows[0]?.fencingToken;
      if (!fencingToken) return null;
      const missionVersion = await client.query<{ stateVersion: number } & DatabaseRow>(
        `update "mcf_missions" set "state" = 'EXECUTING', "version" = "version" + 1, "updated_at" = $1
         where "id" = $2 returning "version" as "stateVersion"`,
        [now, selected.missionId],
      );
      const stateVersion = missionVersion.rows[0]!.stateVersion;
      await insertWorkEvent(client, {
        missionId: selected.missionId,
        eventType: 'MISSION_CLAIMED',
        payload: { workerId: owner, fencingToken, stateVersion, leaseExpiresAt: leaseExpiresAt.toISOString() },
        idempotencyKey: `continuity:${selected.missionId}:fence:${fencingToken}:claimed`,
        occurredAt: now,
      });
      const mission = (await requireMission(client, selected.missionId, false)).response;
      return { mission, leaseToken, fencingToken, stateVersion };
    });
  }

  async heartbeatMission(
    input: McfMissionHeartbeatInput,
    now = new Date(),
  ): Promise<McfContinuityMissionResponse> {
    validateLeaseDuration(input.leaseDurationMs);
    const leaseExpiresAt = new Date(now.getTime() + input.leaseDurationMs);
    return withTransaction(this.database, async (client) => {
      const mission = await requireMission(client, input.missionId);
      requireLease(mission.row, input, now);
      await client.query(
        `update "mcf_mission_continuity"
         set "heartbeat_at" = $1, "lease_expires_at" = $2, "updated_at" = $1
         where "mission_id" = $3`,
        [now, leaseExpiresAt, input.missionId],
      );
      await client.query(
        `update "mcf_work_jobs" set "heartbeat_at" = $1, "lease_expires_at" = $2, "updated_at" = $1
         where "mission_id" = $3 and "step_key" is not null and "status" = 'RUNNING'
           and "lease_token" = $4`,
        [now, leaseExpiresAt, input.missionId, input.leaseToken],
      );
      await client.query(
        `update "mcf_work_attempts" attempt set "heartbeat_at" = $1
         from "mcf_work_jobs" job
         where attempt."job_id" = job."id" and job."mission_id" = $2
           and attempt."status" = 'RUNNING' and attempt."lease_token" = $3`,
        [now, input.missionId, input.leaseToken],
      );
      return (await requireMission(client, input.missionId, false)).response;
    });
  }

  async bindWorktree(
    input: McfBindMissionWorktreeInput,
    now = new Date(),
  ): Promise<McfContinuityMissionResponse> {
    validateVersion(input.expectedStateVersion);
    const worktreePath = validateWorktreePath(input.worktreePath);
    return withTransaction(this.database, async (client) => {
      const mission = await requireMission(client, input.missionId);
      requireLease(mission.row, input, now);
      if (mission.row.worktreePath === worktreePath) return mission.response;
      if (mission.row.worktreePath !== null) {
        throw new McfContinuityMissionConflictError(input.missionId, 'worktree is already bound');
      }
      const updated = await client.query(
        `update "mcf_missions" set "version" = "version" + 1, "updated_at" = $1
         where "id" = $2 and "version" = $3`,
        [now, input.missionId, input.expectedStateVersion],
      );
      if (!updated.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'state version changed while binding worktree');
      }
      await client.query(
        `update "mcf_mission_continuity" set "worktree_path" = $1, "updated_at" = $2
         where "mission_id" = $3`,
        [worktreePath, now, input.missionId],
      );
      await insertWorkEvent(client, {
        missionId: input.missionId,
        eventType: 'MISSION_WORKTREE_BOUND',
        payload: { worktreePath, stateVersion: input.expectedStateVersion + 1 },
        idempotencyKey: `continuity:${input.missionId}:worktree-bound`,
        occurredAt: now,
      });
      return (await requireMission(client, input.missionId, false)).response;
    });
  }

  async beginStep(
    input: McfBeginMissionStepInput,
    now = new Date(),
  ): Promise<McfBegunMissionStep> {
    validateVersion(input.expectedStateVersion);
    const stepKey = nonEmpty(input.stepKey, 'stepKey', 128);
    return withTransaction(this.database, async (client) => {
      const mission = await requireMission(client, input.missionId);
      requireLease(mission.row, input, now);
      if (mission.row.currentStepKey !== null) {
        throw new McfContinuityMissionConflictError(
          input.missionId,
          `step ${mission.row.currentStepKey} is already running`,
        );
      }
      const running = await client.query(
        `select 1 from "mcf_work_jobs"
         where "mission_id" = $1 and "step_key" is not null and "status" = 'RUNNING' limit 1`,
        [input.missionId],
      );
      if (running.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'another mission step is already running');
      }
      const stepResult = await client.query<StepRow>(
        `select ${stepColumns} from "mcf_work_jobs" step
         where step."mission_id" = $1 and step."step_key" = $2
         for update`,
        [input.missionId, stepKey],
      );
      const step = stepResult.rows[0];
      if (!step) throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} does not exist`);
      if (!['QUEUED', 'RETRY_WAIT'].includes(step.status)) {
        throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} is ${step.status}`);
      }
      const runnable = await client.query(
        `select 1 from "mcf_work_jobs" candidate
         where candidate."id" = $1 and candidate."next_attempt_at" <= $2
           and not exists (
             select 1
             from jsonb_array_elements_text(candidate."depends_on_step_keys") dependency("step_key")
             where not exists (
               select 1 from "mcf_work_jobs" completed
               where completed."mission_id" = candidate."mission_id"
                 and completed."step_key" = dependency."step_key"
                 and completed."status" = 'SUCCEEDED'
             )
           )
           and (
             not candidate."gate_required" or exists (
               select 1 from "mcf_work_gates" gate
               where gate."job_id" = candidate."id" and gate."spec_digest" = candidate."spec_digest"
                 and gate."state" = 'APPROVED'
                 and (gate."expires_at" is null or gate."expires_at" > $2)
             )
           )`,
        [step.jobId, now],
      );
      if (!runnable.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} dependencies or gate are not ready`);
      }

      const attemptId = randomUUID();
      const attemptNumber = step.attemptCount + 1;
      await client.query(
        `update "mcf_work_jobs"
         set "status" = 'RUNNING', "attempt_count" = $1, "state_version" = "state_version" + 1,
             "lease_owner" = $2, "lease_token" = $3, "lease_expires_at" = $4,
             "heartbeat_at" = $5, "failure" = null, "updated_at" = $5
         where "id" = $6`,
        [attemptNumber, mission.row.leaseOwner, input.leaseToken, mission.row.leaseExpiresAt, now, step.jobId],
      );
      await client.query(
        `insert into "mcf_work_attempts" (
           "id", "job_id", "attempt_number", "worker_id", "lease_token", "status",
           "started_at", "heartbeat_at"
         ) values ($1, $2, $3, $4, $5, 'RUNNING', $6, $6)`,
        [attemptId, step.jobId, attemptNumber, mission.row.leaseOwner, input.leaseToken, now],
      );
      const versionUpdate = await client.query(
        `update "mcf_missions" set "version" = "version" + 1, "current_agent_id" = $1,
             "updated_at" = $2
         where "id" = $3 and "version" = $4`,
        [mission.response.spec.agentId ?? null, now, input.missionId, input.expectedStateVersion],
      );
      if (!versionUpdate.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'state version changed before step start');
      }
      await client.query(
        `update "mcf_mission_continuity" set "current_step_key" = $1, "updated_at" = $2
         where "mission_id" = $3`,
        [stepKey, now, input.missionId],
      );
      await insertWorkEvent(client, {
        missionId: input.missionId,
        jobId: step.jobId,
        attemptId,
        eventType: 'MISSION_STEP_STARTED',
        payload: {
          stepKey,
          attemptNumber,
          fencingToken: input.fencingToken,
          stateVersion: input.expectedStateVersion + 1,
        },
        idempotencyKey: `continuity:${input.missionId}:step:${stepKey}:attempt:${attemptNumber}:started`,
        occurredAt: now,
      });
      const current = (await requireMission(client, input.missionId, false)).response;
      return {
        mission: current,
        step: current.steps.find((candidate) => candidate.stepKey === stepKey)!,
        attemptId,
        attemptNumber,
      };
    });
  }

  async completeStepAtomic(
    input: McfCompleteMissionStepInput,
    now = new Date(),
  ): Promise<McfCompletedMissionStep> {
    validateVersion(input.expectedStateVersion);
    const stepKey = nonEmpty(input.stepKey, 'stepKey', 128);
    const checkpoint = validateCheckpoint(input.checkpoint);
    const artifacts = (input.artifacts ?? []).map(validateArtifact);
    if (new Set(artifacts.map((artifact) => artifact.artifactKey)).size !== artifacts.length) {
      throw new Error('artifactKey values must be unique within a checkpoint');
    }
    return withTransaction(this.database, async (client) => {
      const existing = await client.query<CheckpointRow>(
        `select
           "id", "sequence"::text as "sequence", "mission_id" as "missionId",
           "job_id" as "jobId", "step_key" as "stepKey", "attempt_number" as "attemptNumber",
           "state_version" as "stateVersion", "fencing_token" as "fencingToken",
           "checkpoint", "result", "created_at" as "createdAt"
         from "mcf_mission_checkpoints"
         where "mission_id" = $1 and "checkpoint_key" = $2`,
        [input.missionId, checkpoint.checkpointKey],
      );
      if (existing.rows[0]) {
        const persisted = existing.rows[0];
        const persistedResult = record<McfWorkResult>(persisted.result, `checkpoint ${persisted.id}`);
        if (persisted.stepKey !== stepKey || persistedResult.patchDigest !== input.result.patchDigest) {
          throw new McfContinuityMissionConflictError(
            input.missionId,
            `checkpoint key ${checkpoint.checkpointKey} is bound to a different result`,
          );
        }
        return {
          mission: (await requireMission(client, input.missionId, false)).response,
          checkpoint: {
            ...record<McfMissionCheckpointInput>(persisted.checkpoint, `checkpoint ${persisted.id}`),
            id: persisted.id,
            sequence: persisted.sequence,
            missionId: persisted.missionId,
            jobId: persisted.jobId,
            stepKey: persisted.stepKey,
            attemptNumber: persisted.attemptNumber,
            stateVersion: persisted.stateVersion,
            fencingToken: persisted.fencingToken,
            result: persistedResult,
            createdAt: persisted.createdAt.toISOString(),
          },
          duplicate: true,
        };
      }

      const mission = await requireMission(client, input.missionId);
      requireLease(mission.row, input, now);
      if (mission.row.currentStepKey !== stepKey) {
        throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} is not current`);
      }
      if (!mission.row.worktreePath || mission.row.worktreePath !== checkpoint.repositoryState.worktreePath) {
        throw new McfContinuityMissionConflictError(input.missionId, 'checkpoint worktree does not match the bound worktree');
      }
      const stepResult = await client.query<StepRow>(
        `select ${stepColumns} from "mcf_work_jobs"
         where "mission_id" = $1 and "step_key" = $2 for update`,
        [input.missionId, stepKey],
      );
      const step = stepResult.rows[0];
      if (!step || step.status !== 'RUNNING') {
        throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} is not running`);
      }
      const attemptResult = await client.query<AttemptRow>(
        `select "id", "attempt_number" as "attemptNumber" from "mcf_work_attempts"
         where "job_id" = $1 and "lease_token" = $2 and "status" = 'RUNNING' for update`,
        [step.jobId, input.leaseToken],
      );
      const attempt = attemptResult.rows[0];
      if (!attempt) throw new McfContinuityMissionLeaseLostError(input.missionId);

      const nextStateVersion = input.expectedStateVersion + 1;
      const checkpointId = randomUUID();
      const insertedCheckpoint = await client.query<CheckpointRow>(
        `insert into "mcf_mission_checkpoints" (
           "id", "mission_id", "job_id", "step_key", "attempt_number", "checkpoint_key",
           "state_version", "fencing_token", "checkpoint", "result", "created_at"
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
         returning
           "id", "sequence"::text as "sequence", "mission_id" as "missionId",
           "job_id" as "jobId", "step_key" as "stepKey", "attempt_number" as "attemptNumber",
           "state_version" as "stateVersion", "fencing_token" as "fencingToken",
           "checkpoint", "result", "created_at" as "createdAt"`,
        [
          checkpointId,
          input.missionId,
          step.jobId,
          stepKey,
          attempt.attemptNumber,
          checkpoint.checkpointKey,
          nextStateVersion,
          input.fencingToken,
          JSON.stringify(checkpoint),
          JSON.stringify(input.result),
          now,
        ],
      );

      for (const artifact of artifacts) {
        const collision = await client.query<{ sha256: string; relativePath: string } & DatabaseRow>(
          `select "sha256", "relative_path" as "relativePath"
           from "mcf_mission_artifacts" where "mission_id" = $1 and "artifact_key" = $2`,
          [input.missionId, artifact.artifactKey],
        );
        if (collision.rows[0]) {
          if (
            collision.rows[0].sha256 !== artifact.sha256 ||
            collision.rows[0].relativePath !== artifact.relativePath
          ) {
            throw new McfContinuityMissionConflictError(
              input.missionId,
              `artifact key ${artifact.artifactKey} is bound to different content`,
            );
          }
          continue;
        }
        await client.query(
          `insert into "mcf_mission_artifacts" (
             "id", "mission_id", "job_id", "checkpoint_id", "artifact_key", "kind",
             "relative_path", "sha256", "size_bytes", "media_type", "metadata", "created_at"
           ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)`,
          [
            randomUUID(),
            input.missionId,
            step.jobId,
            checkpointId,
            artifact.artifactKey,
            artifact.kind,
            artifact.relativePath,
            artifact.sha256,
            artifact.sizeBytes,
            artifact.mediaType,
            JSON.stringify(artifact.metadata ?? {}),
            now,
          ],
        );
      }

      await client.query(
        `update "mcf_work_jobs"
         set "status" = 'SUCCEEDED', "result" = $1::jsonb, "failure" = null,
             "state_version" = "state_version" + 1,
             "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
             "heartbeat_at" = null, "finished_at" = $2, "updated_at" = $2
         where "id" = $3 and "status" = 'RUNNING' and "lease_token" = $4`,
        [JSON.stringify(input.result), now, step.jobId, input.leaseToken],
      );
      await client.query(
        `update "mcf_work_attempts"
         set "status" = 'SUCCEEDED', "result" = $1::jsonb, "heartbeat_at" = $2, "finished_at" = $2
         where "id" = $3 and "status" = 'RUNNING'`,
        [JSON.stringify(input.result), now, attempt.id],
      );

      const completedStepCount = mission.row.completedStepCount + 1;
      const missionCompleted = completedStepCount === mission.row.totalStepCount;
      const versionUpdate = await client.query(
        `update "mcf_missions"
         set "state" = $1, "version" = "version" + 1, "current_agent_id" = null,
             "updated_at" = $2
         where "id" = $3 and "version" = $4`,
        [missionCompleted ? 'COMPLETED' : 'EXECUTING', now, input.missionId, input.expectedStateVersion],
      );
      if (!versionUpdate.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'state version changed before checkpoint commit');
      }
      await client.query(
        `update "mcf_mission_continuity"
         set "status" = $1, "current_step_key" = null, "completed_step_count" = $2,
             "result" = $3::jsonb, "failure" = null,
             "lease_owner" = $4, "lease_token" = $5, "lease_expires_at" = $6,
             "heartbeat_at" = $7, "finished_at" = $8, "updated_at" = $9
         where "mission_id" = $10`,
        [
          missionCompleted ? 'SUCCEEDED' : 'RUNNING',
          completedStepCount,
          missionCompleted ? JSON.stringify(input.result) : null,
          missionCompleted ? null : mission.row.leaseOwner,
          missionCompleted ? null : input.leaseToken,
          missionCompleted ? null : mission.row.leaseExpiresAt,
          missionCompleted ? null : mission.row.heartbeatAt,
          missionCompleted ? now : null,
          now,
          input.missionId,
        ],
      );
      await insertWorkEvent(client, {
        missionId: input.missionId,
        jobId: step.jobId,
        attemptId: attempt.id,
        eventType: missionCompleted ? 'MISSION_COMPLETED' : 'MISSION_STEP_COMPLETED',
        payload: {
          stepKey,
          checkpointKey: checkpoint.checkpointKey,
          checkpointId,
          attemptNumber: attempt.attemptNumber,
          stateVersion: nextStateVersion,
          patchDigest: input.result.patchDigest,
        },
        idempotencyKey: `continuity:${input.missionId}:checkpoint:${checkpoint.checkpointKey}`,
        occurredAt: now,
      });

      const persisted = insertedCheckpoint.rows[0]!;
      return {
        mission: (await requireMission(client, input.missionId, false)).response,
        checkpoint: {
          ...checkpoint,
          id: persisted.id,
          sequence: persisted.sequence,
          missionId: input.missionId,
          jobId: step.jobId,
          stepKey,
          attemptNumber: attempt.attemptNumber,
          stateVersion: nextStateVersion,
          fencingToken: input.fencingToken,
          result: input.result,
          createdAt: now.toISOString(),
        },
        duplicate: false,
      };
    });
  }

  async recordStepFailure(
    input: McfFailMissionStepInput,
    now = new Date(),
  ): Promise<McfContinuityMissionResponse> {
    validateVersion(input.expectedStateVersion);
    const stepKey = nonEmpty(input.stepKey, 'stepKey', 128);
    return withTransaction(this.database, async (client) => {
      const mission = await requireMission(client, input.missionId);
      requireLease(mission.row, input, now);
      if (mission.row.currentStepKey !== stepKey) {
        throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} is not current`);
      }
      const stepResult = await client.query<StepRow>(
        `select ${stepColumns} from "mcf_work_jobs"
         where "mission_id" = $1 and "step_key" = $2 for update`,
        [input.missionId, stepKey],
      );
      const step = stepResult.rows[0];
      if (!step || step.status !== 'RUNNING') {
        throw new McfContinuityMissionConflictError(input.missionId, `step ${stepKey} is not running`);
      }
      const attemptResult = await client.query<AttemptRow>(
        `select "id", "attempt_number" as "attemptNumber" from "mcf_work_attempts"
         where "job_id" = $1 and "lease_token" = $2 and "status" = 'RUNNING' for update`,
        [step.jobId, input.leaseToken],
      );
      const attempt = attemptResult.rows[0];
      if (!attempt) throw new McfContinuityMissionLeaseLostError(input.missionId);

      const retry = decideMcfWorkRetry({
        failure: input.failure,
        attemptCount: step.attemptCount,
        maxAttempts: step.maxAttempts,
        now,
      });
      let stepStatus: McfWorkJobStatus;
      let missionStatus: McfContinuityMissionStatus;
      let runtimeState: string;
      let terminal = false;
      if (input.failure.kind === 'AUTH') {
        stepStatus = 'BLOCKED_AUTH';
        missionStatus = 'BLOCKED_AUTH';
        runtimeState = 'WAITING_EXTERNAL';
      } else if (input.failure.kind === 'POLICY') {
        stepStatus = 'BLOCKED_POLICY';
        missionStatus = 'BLOCKED_POLICY';
        runtimeState = 'BLOCKED_RISK';
      } else if (retry.status === 'RETRY_WAIT') {
        stepStatus = 'RETRY_WAIT';
        missionStatus = 'RETRY_WAIT';
        runtimeState = 'RECOVERING';
      } else {
        stepStatus = retry.status === 'DEAD' ? 'DEAD' : 'FAILED';
        missionStatus = 'FAILED';
        runtimeState = 'BLOCKED_RISK';
        terminal = true;
      }
      await client.query(
        `update "mcf_work_jobs"
         set "status" = $1, "failure" = $2::jsonb, "next_attempt_at" = $3,
             "state_version" = "state_version" + 1,
             "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
             "heartbeat_at" = null, "finished_at" = $4, "updated_at" = $5
         where "id" = $6`,
        [stepStatus, JSON.stringify(input.failure), retry.nextAttemptAt ?? now, terminal ? now : null, now, step.jobId],
      );
      await client.query(
        `update "mcf_work_attempts"
         set "status" = 'FAILED', "failure" = $1::jsonb, "heartbeat_at" = $2, "finished_at" = $2
         where "id" = $3 and "status" = 'RUNNING'`,
        [JSON.stringify(input.failure), now, attempt.id],
      );
      const versionUpdate = await client.query(
        `update "mcf_missions"
         set "state" = $1, "version" = "version" + 1, "current_agent_id" = null,
             "updated_at" = $2
         where "id" = $3 and "version" = $4`,
        [runtimeState, now, input.missionId, input.expectedStateVersion],
      );
      if (!versionUpdate.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'state version changed before failure commit');
      }
      await client.query(
        `update "mcf_mission_continuity"
         set "status" = $1, "current_step_key" = null, "failure" = $2::jsonb,
             "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
             "heartbeat_at" = null, "finished_at" = $3, "updated_at" = $4
         where "mission_id" = $5`,
        [missionStatus, JSON.stringify(input.failure), terminal ? now : null, now, input.missionId],
      );
      await insertWorkEvent(client, {
        missionId: input.missionId,
        jobId: step.jobId,
        attemptId: attempt.id,
        eventType:
          missionStatus === 'RETRY_WAIT'
            ? 'MISSION_STEP_RETRY_SCHEDULED'
            : missionStatus === 'BLOCKED_AUTH'
              ? 'MISSION_BLOCKED_AUTH'
              : missionStatus === 'BLOCKED_POLICY'
                ? 'MISSION_BLOCKED_POLICY'
                : 'MISSION_FAILED',
        payload: {
          stepKey,
          attemptNumber: attempt.attemptNumber,
          failureCode: input.failure.code,
          status: missionStatus,
          stateVersion: input.expectedStateVersion + 1,
        },
        idempotencyKey: `continuity:${input.missionId}:step:${stepKey}:attempt:${attempt.attemptNumber}:failure`,
        occurredAt: now,
      });
      return (await requireMission(client, input.missionId, false)).response;
    });
  }

  async continueMission(
    input: McfContinueMissionInput,
    now = new Date(),
  ): Promise<McfContinuityMissionResponse> {
    validateVersion(input.expectedStateVersion);
    const actor = nonEmpty(input.actor, 'continuation actor', 128);
    const reason = nonEmpty(input.reason, 'continuation reason', 2_000);
    const idempotencyKey = nonEmpty(input.idempotencyKey, 'idempotencyKey', 256);
    return withTransaction(this.database, async (client) => {
      const prior = await client.query(
        `select 1 from "mcf_work_events" where "idempotency_key" = $1 and "mission_id" = $2`,
        [idempotencyKey, input.missionId],
      );
      if (prior.rowCount) return (await requireMission(client, input.missionId, false)).response;

      const mission = await requireMission(client, input.missionId);
      if (mission.row.stateVersion !== input.expectedStateVersion) {
        throw new McfContinuityMissionConflictError(
          input.missionId,
          `expected state version ${input.expectedStateVersion}, found ${mission.row.stateVersion}`,
        );
      }
      if (mission.row.status === 'RUNNING' || mission.row.leaseToken !== null) {
        throw new McfContinuityMissionConflictError(input.missionId, 'a live worker owns this mission');
      }
      if (!['BLOCKED_AUTH', 'WAITING_GATE'].includes(mission.row.status)) {
        throw new McfContinuityMissionConflictError(
          input.missionId,
          `mission cannot continue from ${mission.row.status}`,
        );
      }
      if (mission.row.status === 'BLOCKED_AUTH') {
        await client.query(
          `update "mcf_work_jobs"
           set "status" = 'RETRY_WAIT', "next_attempt_at" = $1, "updated_at" = $1
           where "mission_id" = $2 and "step_key" is not null and "status" = 'BLOCKED_AUTH'`,
          [now, input.missionId],
        );
      }
      const runnable = await client.query(
        `select 1 from "mcf_work_jobs" step
         where step."mission_id" = $1 and step."step_key" is not null
           and step."status" in ('QUEUED', 'RETRY_WAIT') and step."next_attempt_at" <= $2
           and not exists (
             select 1 from jsonb_array_elements_text(step."depends_on_step_keys") dependency("step_key")
             where not exists (
               select 1 from "mcf_work_jobs" completed
               where completed."mission_id" = step."mission_id"
                 and completed."step_key" = dependency."step_key" and completed."status" = 'SUCCEEDED'
             )
           )
           and (
             not step."gate_required" or exists (
               select 1 from "mcf_work_gates" gate
               where gate."job_id" = step."id" and gate."spec_digest" = step."spec_digest"
                 and gate."state" = 'APPROVED'
                 and (gate."expires_at" is null or gate."expires_at" > $2)
             )
           ) limit 1`,
        [input.missionId, now],
      );
      if (!runnable.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'no step is runnable after continuation');
      }
      const versionUpdate = await client.query(
        `update "mcf_missions" set "state" = 'RECOVERING', "version" = "version" + 1, "updated_at" = $1
         where "id" = $2 and "version" = $3`,
        [now, input.missionId, input.expectedStateVersion],
      );
      if (!versionUpdate.rowCount) {
        throw new McfContinuityMissionConflictError(input.missionId, 'state version changed during continuation');
      }
      await client.query(
        `update "mcf_mission_continuity"
         set "status" = 'QUEUED', "failure" = null, "updated_at" = $1
         where "mission_id" = $2`,
        [now, input.missionId],
      );
      await insertWorkEvent(client, {
        missionId: input.missionId,
        eventType: 'MISSION_CONTINUED',
        payload: { actor, reason, stateVersion: input.expectedStateVersion + 1 },
        idempotencyKey,
        occurredAt: now,
      });
      return (await requireMission(client, input.missionId, false)).response;
    });
  }

  async recoverExpiredMissionLeases(now = new Date()): Promise<McfMissionRecoverySummary> {
    return withTransaction(this.database, async (client) => {
      const expired = await client.query<MissionRow>(
        `select ${missionColumns}
         from "mcf_mission_continuity" continuity
         join "mcf_missions" mission on mission."id" = continuity."mission_id"
         where continuity."status" = 'RUNNING' and continuity."lease_expires_at" <= $1
         order by continuity."lease_expires_at", continuity."mission_id"
         for update of continuity, mission skip locked`,
        [now],
      );
      let recoveredForRetry = 0;
      let movedToFailed = 0;
      for (const mission of expired.rows) {
        const runningStep = await client.query<StepRow>(
          `select ${stepColumns} from "mcf_work_jobs"
           where "mission_id" = $1 and "step_key" is not null and "status" = 'RUNNING'
           for update`,
          [mission.id],
        );
        const step = runningStep.rows[0];
        let retry = true;
        let failure: McfWorkFailure = {
          code: 'MISSION_LEASE_EXPIRED',
          message: 'The mission worker lease expired before a durable terminal transition.',
          kind: 'TRANSIENT',
          retryable: true,
        };
        let attempt: AttemptRow | undefined;
        if (step) {
          retry = step.attemptCount < step.maxAttempts;
          failure = { ...failure, retryable: retry };
          const attemptResult = await client.query<AttemptRow>(
            `select "id", "attempt_number" as "attemptNumber" from "mcf_work_attempts"
             where "job_id" = $1 and "status" = 'RUNNING' for update`,
            [step.jobId],
          );
          attempt = attemptResult.rows[0];
          if (attempt) {
            await client.query(
              `update "mcf_work_attempts"
               set "status" = 'ABANDONED', "failure" = $1::jsonb,
                   "heartbeat_at" = $2, "finished_at" = $2
               where "id" = $3`,
              [JSON.stringify(failure), now, attempt.id],
            );
          }
          await client.query(
            `update "mcf_work_jobs"
             set "status" = $1, "failure" = $2::jsonb, "next_attempt_at" = $3,
                 "state_version" = "state_version" + 1,
                 "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
                 "heartbeat_at" = null, "finished_at" = $4, "updated_at" = $3
             where "id" = $5`,
            [retry ? 'RETRY_WAIT' : 'DEAD', JSON.stringify(failure), now, retry ? null : now, step.jobId],
          );
        }

        const missionStatus: McfContinuityMissionStatus = retry ? 'RETRY_WAIT' : 'FAILED';
        await client.query(
          `update "mcf_missions"
           set "state" = $1, "version" = "version" + 1, "current_agent_id" = null,
               "updated_at" = $2
           where "id" = $3`,
          [retry ? 'RECOVERING' : 'BLOCKED_RISK', now, mission.id],
        );
        await client.query(
          `update "mcf_mission_continuity"
           set "status" = $1, "current_step_key" = null, "failure" = $2::jsonb,
               "lease_owner" = null, "lease_token" = null, "lease_expires_at" = null,
               "heartbeat_at" = null, "finished_at" = $3, "updated_at" = $4
           where "mission_id" = $5`,
          [missionStatus, JSON.stringify(failure), retry ? null : now, now, mission.id],
        );
        await insertWorkEvent(client, {
          missionId: mission.id,
          ...(step ? { jobId: step.jobId } : {}),
          ...(attempt ? { attemptId: attempt.id } : {}),
          eventType: retry ? 'MISSION_LEASE_EXPIRED_RETRY' : 'MISSION_LEASE_EXPIRED_FAILED',
          payload: {
            stepKey: step?.stepKey ?? null,
            attemptNumber: attempt?.attemptNumber ?? null,
            fencingToken: mission.fencingToken,
          },
          idempotencyKey: `continuity:${mission.id}:fence:${mission.fencingToken}:lease-expired`,
          occurredAt: now,
        });
        if (retry) recoveredForRetry += 1;
        else movedToFailed += 1;
      }
      return { recoveredForRetry, movedToFailed };
    });
  }

  async listEvents(
    missionId: string,
    query: McfMissionEventQuery = {},
  ): Promise<McfMissionWorkEventResponse[]> {
    const limit = query.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('event limit is invalid');
    const afterSequence = query.afterSequence ?? '0';
    if (!/^(?:0|[1-9][0-9]*)$/u.test(afterSequence)) throw new Error('afterSequence is invalid');
    const result = await this.database.pool.query<EventRow>(
      `select
         "id", "sequence"::text as "sequence", "mission_id" as "missionId",
         "job_id" as "jobId", "attempt_id" as "attemptId", "event_type" as "eventType",
         "payload", "idempotency_key" as "idempotencyKey", "occurred_at" as "occurredAt"
       from "mcf_work_events"
       where "mission_id" = $1 and "sequence" > $2::bigint
       order by "sequence" limit $3`,
      [missionId, afterSequence, limit],
    );
    return result.rows.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      missionId: row.missionId,
      jobId: row.jobId,
      attemptId: row.attemptId,
      eventType: row.eventType,
      payload: record<Record<string, unknown>>(row.payload, `work event ${row.id}`),
      idempotencyKey: row.idempotencyKey,
      occurredAt: row.occurredAt.toISOString(),
    }));
  }

  async listCheckpoints(missionId: string): Promise<McfMissionCheckpointResponse[]> {
    const result = await this.database.pool.query<CheckpointRow>(
      `select
         "id", "sequence"::text as "sequence", "mission_id" as "missionId",
         "job_id" as "jobId", "step_key" as "stepKey", "attempt_number" as "attemptNumber",
         "state_version" as "stateVersion", "fencing_token" as "fencingToken",
         "checkpoint", "result", "created_at" as "createdAt"
       from "mcf_mission_checkpoints" where "mission_id" = $1 order by "sequence"`,
      [missionId],
    );
    return result.rows.map((row) => ({
      ...record<McfMissionCheckpointInput>(row.checkpoint, `checkpoint ${row.id}`),
      id: row.id,
      sequence: row.sequence,
      missionId: row.missionId,
      jobId: row.jobId,
      stepKey: row.stepKey,
      attemptNumber: row.attemptNumber,
      stateVersion: row.stateVersion,
      fencingToken: row.fencingToken,
      result: record<McfWorkResult>(row.result, `checkpoint ${row.id}`),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listArtifacts(missionId: string): Promise<McfMissionArtifactResponse[]> {
    const result = await this.database.pool.query<ArtifactRow>(
      `select
         "id", "mission_id" as "missionId", "job_id" as "jobId",
         "checkpoint_id" as "checkpointId", "artifact_key" as "artifactKey", "kind",
         "relative_path" as "relativePath", "sha256", "size_bytes"::text as "sizeBytes",
         "media_type" as "mediaType", "metadata", "created_at" as "createdAt"
       from "mcf_mission_artifacts" where "mission_id" = $1
       order by "created_at", "id"`,
      [missionId],
    );
    return result.rows.map((row) => {
      const sizeBytes = Number(row.sizeBytes);
      if (!Number.isSafeInteger(sizeBytes)) throw new Error(`artifact ${row.id} size exceeds JavaScript safe integer range`);
      return {
        id: row.id,
        missionId: row.missionId,
        jobId: row.jobId,
        checkpointId: row.checkpointId,
        artifactKey: row.artifactKey,
        kind: row.kind,
        relativePath: row.relativePath,
        sha256: row.sha256,
        sizeBytes,
        mediaType: row.mediaType,
        metadata: record<Record<string, unknown>>(row.metadata, `artifact ${row.id}`),
        createdAt: row.createdAt.toISOString(),
      };
    });
  }
}
