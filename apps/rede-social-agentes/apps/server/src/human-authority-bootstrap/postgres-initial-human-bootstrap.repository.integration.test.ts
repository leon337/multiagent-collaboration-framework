import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BootstrapDatabaseService } from './bootstrap-database.service.js';
import { PostgresInitialHumanBootstrapRepository } from './postgres-initial-human-bootstrap.repository.js';

const databaseUrl = process.env.DATABASE_URL;
const runEmptyDatabaseIntegration =
  Boolean(databaseUrl) && process.env.BOOTSTRAP_EMPTY_DB_INTEGRATION === '1';
const describeWithDatabase = runEmptyDatabaseIntegration ? describe : describe.skip;

describeWithDatabase('PostgresInitialHumanBootstrapRepository integration', () => {
  it('creates exactly one initial human, session, and audit trail', async () => {
    const database = new BootstrapDatabaseService(databaseUrl!);
    const repository = new PostgresInitialHumanBootstrapRepository(database);
    const accountId = randomUUID();
    const sessionId = randomUUID();
    const now = new Date();
    try {
      const input = {
        accountId,
        email: 'bootstrap.integration@example.test',
        displayName: 'Bootstrap Human',
        passwordHash: 'scrypt$v1$integration-hash',
        sessionId,
        tokenHash: randomUUID(),
        expiresAt: new Date(now.getTime() + 86_400_000),
        now,
        correlationId: randomUUID(),
      };
      await expect(repository.createInitialHuman(input)).resolves.toMatchObject({
        status: 'CREATED',
      });
      await expect(
        repository.createInitialHuman({ ...input, accountId: randomUUID() }),
      ).resolves.toEqual({
        status: 'ALREADY_INITIALIZED',
      });
      const accounts = await database.query<{ count: string }>(
        'select count(*)::text as count from "accounts"',
      );
      const sessions = await database.query<{ count: string }>(
        'select count(*)::text as count from "sessions"',
      );
      const audits = await database.query<{ event_type: string }>(
        `select "event_type" from "audit_events" where "actor_id"=$1 order by "event_type"`,
        [accountId],
      );
      expect(accounts.rows[0]?.count).toBe('1');
      expect(sessions.rows[0]?.count).toBe('1');
      expect(audits.rows.map((row) => row.event_type)).toEqual([
        'HUMAN_ACCOUNT_REGISTERED',
        'HUMAN_AUTHORITY_INITIAL_ACCOUNT_BOOTSTRAPPED',
        'SESSION_CREATED',
      ]);
    } finally {
      await database.query('delete from "audit_events" where "actor_id"=$1', [accountId]);
      await database.query('delete from "accounts" where "id"=$1', [accountId]);
      await database.onModuleDestroy();
    }
  });
});
