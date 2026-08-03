import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { EmailAlreadyExistsError } from './identity.errors.js';
import { PostgresIdentityRepository } from './postgres-identity.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

describe('PostgresIdentityRepository integration', () => {
  let database: DatabaseService;
  let repository: PostgresIdentityRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresIdentityRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('persists account, profile, session and audit events atomically', async () => {
    const accountId = randomUUID();
    const sessionId = randomUUID();
    const email = `human-${accountId}@example.test`;

    try {
      const account = await repository.createHumanAccount({
        id: accountId,
        email,
        displayName: 'Integration Human',
        passwordHash: 'scrypt$integration$hash',
        correlationId: 'integration-register',
      });

      expect(account.email).toBe(email);
      expect(account.displayName).toBe('Integration Human');
      expect(account.status).toBe('ACTIVE');

      const found = await repository.findHumanAccountByEmail(email);
      expect(found).toMatchObject({ id: accountId, email, displayName: 'Integration Human' });

      await repository.createSession({
        sessionId,
        accountId,
        tokenHash: randomUUID().replaceAll('-', ''),
        expiresAt: new Date(Date.now() + 60_000),
        correlationId: 'integration-session',
      });

      const sessionCount = await database.query<CountRow>(
        'select count(*)::text as "count" from "sessions" where "id" = $1',
        [sessionId],
      );
      expect(sessionCount.rows[0]?.count).toBe('1');

      const auditCount = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "audit_events"
          where "aggregate_id" in ($1, $2)
        `,
        [accountId, sessionId],
      );
      expect(auditCount.rows[0]?.count).toBe('2');

      await expect(
        repository.createHumanAccount({
          id: randomUUID(),
          email,
          displayName: 'Duplicate Human',
          passwordHash: 'scrypt$duplicate$hash',
          correlationId: 'integration-duplicate',
        }),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsError);

      const profileCount = await database.query<CountRow>(
        'select count(*)::text as "count" from "human_profiles" where "display_name" = $1',
        ['Duplicate Human'],
      );
      expect(profileCount.rows[0]?.count).toBe('0');
    } finally {
      await database.query('delete from "audit_events" where "aggregate_id" in ($1, $2)', [
        accountId,
        sessionId,
      ]);
      await database.query('delete from "accounts" where "id" = $1', [accountId]);
    }
  });
});
