import { bigint, boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const systemHealthEvents = pgTable('system_health_events', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const humanProfiles = pgTable('human_profiles', {
  accountId: text('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentProfiles = pgTable('agent_profiles', {
  id: text('id').primaryKey(),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  capabilities: jsonb('capabilities').$type<string[]>().notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const responsibilityLinks = pgTable('responsibility_links', {
  id: text('id').primaryKey(),
  agentId: text('agent_id')
    .notNull()
    .references(() => agentProfiles.id, { onDelete: 'cascade' }),
  responsibleAccountId: text('responsible_account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  status: text('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  actorType: text('actor_type').notNull(),
  eventType: text('event_type').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  correlationId: text('correlation_id').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfMissions = pgTable('mcf_missions', {
  id: text('id').primaryKey(),
  contract: jsonb('contract').$type<Record<string, unknown>>().notNull(),
  state: text('state').notNull(),
  currentPhaseId: text('current_phase_id'),
  currentAgentId: text('current_agent_id'),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfPhases = pgTable('mcf_phases', {
  id: text('id').primaryKey(),
  missionId: text('mission_id')
    .notNull()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  skillId: text('skill_id').notNull(),
  agentId: text('agent_id').notNull(),
  state: text('state').notNull(),
  cycle: integer('cycle').default(1).notNull(),
  inputs: jsonb('inputs').$type<Record<string, unknown>>().notNull(),
  expectedEvidence: jsonb('expected_evidence').$type<string[]>().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfToolReceipts = pgTable('mcf_tool_receipts', {
  receiptId: text('receipt_id').primaryKey(),
  missionId: text('mission_id')
    .notNull()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  phaseId: text('phase_id')
    .notNull()
    .references(() => mcfPhases.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  operation: text('operation').notNull(),
  resource: text('resource').notNull(),
  externalId: text('external_id'),
  commitSha: text('commit_sha'),
  status: text('status').notNull(),
  observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
  payloadDigest: text('payload_digest').notNull(),
  signature: text('signature').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
  validationStatus: text('validation_status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfHandoffs = pgTable('mcf_handoffs', {
  id: text('id').primaryKey(),
  missionId: text('mission_id')
    .notNull()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  phaseId: text('phase_id')
    .notNull()
    .references(() => mcfPhases.id, { onDelete: 'cascade' }),
  fromAgentId: text('from_agent_id').notNull(),
  toAgentId: text('to_agent_id').notNull(),
  objectiveState: jsonb('objective_state').$type<Record<string, unknown>>().notNull(),
  delivered: jsonb('delivered').$type<string[]>().notNull(),
  evidenceReceiptIds: jsonb('evidence_receipt_ids').$type<string[]>().notNull(),
  openFindings: jsonb('open_findings').$type<string[]>().notNull(),
  nextAction: text('next_action').notNull(),
  acceptanceForNextAction: text('acceptance_for_next_action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfEvents = pgTable('mcf_events', {
  id: text('id').primaryKey(),
  sequence: bigint('sequence', { mode: 'number' }).notNull().unique(),
  missionId: text('mission_id')
    .notNull()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  phaseId: text('phase_id'),
  agentId: text('agent_id'),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfWorkJobs = pgTable('mcf_work_jobs', {
  id: text('id').primaryKey(),
  dispatchId: text('dispatch_id').notNull().unique(),
  specDigest: text('spec_digest').notNull(),
  missionId: text('mission_id').references(() => mcfMissions.id, { onDelete: 'set null' }),
  phaseId: text('phase_id').references(() => mcfPhases.id, { onDelete: 'set null' }),
  agentId: text('agent_id'),
  repositoryKey: text('repository_key').notNull(),
  baseRef: text('base_ref').notNull(),
  baseSha: text('base_sha').notNull(),
  riskClass: text('risk_class').notNull(),
  gateRequired: boolean('gate_required').default(false).notNull(),
  priority: integer('priority').default(0).notNull(),
  spec: jsonb('spec').$type<Record<string, unknown>>().notNull(),
  status: text('status').notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
  leaseOwner: text('lease_owner'),
  leaseToken: text('lease_token'),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
  heartbeatAt: timestamp('heartbeat_at', { withTimezone: true }),
  cancellationRequested: boolean('cancellation_requested').default(false).notNull(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  failure: jsonb('failure').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  stepKey: text('step_key'),
  stepOrder: integer('step_order'),
  dependsOnStepKeys: jsonb('depends_on_step_keys').$type<string[]>(),
  stateVersion: integer('state_version').default(1).notNull(),
});

export const mcfWorkAttempts = pgTable('mcf_work_attempts', {
  id: text('id').primaryKey(),
  jobId: text('job_id')
    .notNull()
    .references(() => mcfWorkJobs.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull(),
  workerId: text('worker_id').notNull(),
  leaseToken: text('lease_token').notNull(),
  status: text('status').notNull(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  failure: jsonb('failure').$type<Record<string, unknown>>(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  heartbeatAt: timestamp('heartbeat_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const mcfWorkGates = pgTable('mcf_work_gates', {
  id: text('id').primaryKey(),
  jobId: text('job_id')
    .notNull()
    .references(() => mcfWorkJobs.id, { onDelete: 'cascade' }),
  specDigest: text('spec_digest').notNull(),
  state: text('state').notNull(),
  decidedBy: text('decided_by'),
  reason: text('reason'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfWorkEvents = pgTable('mcf_work_events', {
  id: text('id').primaryKey(),
  sequence: bigint('sequence', { mode: 'number' }).notNull().unique(),
  missionId: text('mission_id').references(() => mcfMissions.id, { onDelete: 'cascade' }),
  jobId: text('job_id').references(() => mcfWorkJobs.id, { onDelete: 'cascade' }),
  attemptId: text('attempt_id').references(() => mcfWorkAttempts.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfMissionContinuity = pgTable('mcf_mission_continuity', {
  missionId: text('mission_id')
    .primaryKey()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  dispatchId: text('dispatch_id').notNull().unique(),
  specDigest: text('spec_digest').notNull(),
  projectKey: text('project_key').notNull(),
  repositoryKey: text('repository_key').notNull(),
  priority: integer('priority').default(0).notNull(),
  spec: jsonb('spec').$type<Record<string, unknown>>().notNull(),
  status: text('status').notNull(),
  fencingToken: integer('fencing_token').default(0).notNull(),
  currentStepKey: text('current_step_key'),
  completedStepCount: integer('completed_step_count').default(0).notNull(),
  totalStepCount: integer('total_step_count').notNull(),
  worktreePath: text('worktree_path'),
  leaseOwner: text('lease_owner'),
  leaseToken: text('lease_token'),
  leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
  heartbeatAt: timestamp('heartbeat_at', { withTimezone: true }),
  cancellationRequested: boolean('cancellation_requested').default(false).notNull(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  failure: jsonb('failure').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const mcfMissionCheckpoints = pgTable('mcf_mission_checkpoints', {
  id: text('id').primaryKey(),
  sequence: bigint('sequence', { mode: 'number' }).notNull().unique(),
  missionId: text('mission_id')
    .notNull()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  jobId: text('job_id')
    .notNull()
    .references(() => mcfWorkJobs.id, { onDelete: 'cascade' }),
  stepKey: text('step_key').notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  checkpointKey: text('checkpoint_key').notNull(),
  stateVersion: integer('state_version').notNull(),
  fencingToken: integer('fencing_token').notNull(),
  checkpoint: jsonb('checkpoint').$type<Record<string, unknown>>().notNull(),
  result: jsonb('result').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mcfMissionArtifacts = pgTable('mcf_mission_artifacts', {
  id: text('id').primaryKey(),
  missionId: text('mission_id')
    .notNull()
    .references(() => mcfMissions.id, { onDelete: 'cascade' }),
  jobId: text('job_id').references(() => mcfWorkJobs.id, { onDelete: 'cascade' }),
  checkpointId: text('checkpoint_id').references(() => mcfMissionCheckpoints.id, {
    onDelete: 'cascade',
  }),
  artifactKey: text('artifact_key').notNull(),
  kind: text('kind').notNull(),
  relativePath: text('relative_path').notNull(),
  sha256: text('sha256').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  mediaType: text('media_type').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
