import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const systemHealthEvents = pgTable('system_health_events', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
