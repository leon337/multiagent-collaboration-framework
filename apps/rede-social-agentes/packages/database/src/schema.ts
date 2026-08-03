import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
