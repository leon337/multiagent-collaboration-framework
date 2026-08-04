import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
