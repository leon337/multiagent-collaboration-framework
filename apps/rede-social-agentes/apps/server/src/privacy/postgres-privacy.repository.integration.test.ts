import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { PasswordService } from '../identity/password.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import { PostgresPrivacyRepository } from './postgres-privacy.repository.js';
import { PrivacyService } from './privacy.service.js';

interface AccountStateRow extends DatabaseRow {
  email: string;
  status: string;
  anonymized_at: Date | null;
  display_name: string;
}

interface StatusRow extends DatabaseRow {
  status: string;
}

describe('PostgresPrivacyRepository integration', () => {
  let database: DatabaseService;
  let identity: PostgresIdentityRepository;
  let passwords: PasswordService;
  let repository: PostgresPrivacyRepository;
  let service: PrivacyService;

  beforeAll(() => {
    database = new DatabaseService();
    identity = new PostgresIdentityRepository(database);
    passwords = new PasswordService();
    repository = new PostgresPrivacyRepository(database);
    service = new PrivacyService(repository, passwords);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('exports without secrets and anonymizes the account atomically', async () => {
    const accountId = randomUUID();
    const sessionId = randomUUID();
    const tokenHash = randomUUID().replaceAll('-', '');
    const email = `privacy-${accountId}@example.test`;
    const password = 'privacy-integration-password';

    try {
      await identity.createHumanAccount({
        id: accountId,
        email,
        displayName: 'Privacy Human',
        passwordHash: await passwords.hash(password),
        correlationId: 'privacy-register',
      });
      await identity.createSession({
        sessionId,
        accountId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        correlationId: 'privacy-session',
      });

      const exported = await service.exportAccountData(accountId, 'privacy-export');
      const serialized = JSON.stringify(exported);
      expect(exported.sections.map((section) => section.name)).toContain('account');
      expect(exported.sections.map((section) => section.name)).toContain('sessions');
      expect(serialized).toContain(email);
      expect(serialized).not.toContain('password_hash');
      expect(serialized).not.toContain('token_hash');
      expect(serialized).not.toContain(tokenHash);

      const anonymized = await service.anonymizeAccount(accountId, password, 'privacy-anonymize');
      expect(anonymized).toMatchObject({
        accountId,
        status: 'ANONYMIZED',
        sessionsRevoked: 1,
      });

      const state = await database.query<AccountStateRow>(
        `
          select a."email", a."status", a."anonymized_at", p."display_name"
          from "accounts" a
          inner join "human_profiles" p on p."account_id" = a."id"
          where a."id" = $1
        `,
        [accountId],
      );
      expect(state.rows[0]).toMatchObject({
        email: `anonymized+${accountId}@invalid.local`,
        status: 'ANONYMIZED',
        display_name: 'Conta anonimizada',
      });
      expect(state.rows[0]?.anonymized_at).toBeInstanceOf(Date);
      await expect(identity.findActiveSessionByTokenHash(tokenHash)).resolves.toBeNull();
    } finally {
      await database.query('delete from "privacy_requests" where "account_id" = $1', [accountId]);
      await database.query('delete from "audit_events" where "actor_id" = $1', [accountId]);
      await database.query('delete from "accounts" where "id" = $1', [accountId]);
    }
  });

  it('records and returns a blocker without changing personal identifiers', async () => {
    const accountId = randomUUID();
    const agentId = randomUUID();
    const responsibilityId = randomUUID();
    const email = `blocked-${accountId}@example.test`;
    const password = 'blocked-integration-password';

    try {
      await identity.createHumanAccount({
        id: accountId,
        email,
        displayName: 'Blocked Human',
        passwordHash: await passwords.hash(password),
        correlationId: 'blocked-register',
      });
      await database.query(
        `
          insert into "agent_profiles" (
            "id", "handle", "display_name", "bio", "capabilities", "status"
          ) values ($1, $2, 'Privacy Agent', null, '[]'::jsonb, 'ACTIVE')
        `,
        [agentId, `privacy_${agentId.replaceAll('-', '').slice(0, 16)}`],
      );
      await database.query(
        `
          insert into "responsibility_links" (
            "id", "agent_id", "responsible_account_id", "status"
          ) values ($1, $2, $3, 'ACTIVE')
        `,
        [responsibilityId, agentId, accountId],
      );

      await expect(
        service.anonymizeAccount(accountId, password, 'blocked-anonymize'),
      ).rejects.toMatchObject({
        blockers: ['ACTIVE_AGENT_RESPONSIBILITY'],
      });

      const account = await database.query<AccountStateRow>(
        `
          select a."email", a."status", a."anonymized_at", p."display_name"
          from "accounts" a
          inner join "human_profiles" p on p."account_id" = a."id"
          where a."id" = $1
        `,
        [accountId],
      );
      expect(account.rows[0]).toMatchObject({
        email,
        status: 'ACTIVE',
        anonymized_at: null,
        display_name: 'Blocked Human',
      });

      const privacyRequest = await database.query<StatusRow>(
        `
          select "status"
          from "privacy_requests"
          where "account_id" = $1 and "request_type" = 'ANONYMIZATION'
          order by "requested_at" desc
          limit 1
        `,
        [accountId],
      );
      expect(privacyRequest.rows[0]?.status).toBe('BLOCKED');
    } finally {
      await database.query('delete from "privacy_requests" where "account_id" = $1', [accountId]);
      await database.query('delete from "audit_events" where "actor_id" = $1', [accountId]);
      await database.query('delete from "responsibility_links" where "id" = $1', [
        responsibilityId,
      ]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" = $1', [accountId]);
    }
  });
});
