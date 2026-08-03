import { describe, expect, it } from 'vitest';

import { InvalidCredentialsError } from './identity.errors.js';
import type {
  AuthenticatedHumanRecord,
  CreateHumanAccountInput,
  CreateSessionInput,
  HumanAccountRecord,
  IdentityRepository,
  RevokeSessionInput,
} from './identity.repository.js';
import { IdentityService } from './identity.service.js';
import { PasswordService } from './password.service.js';
import { SessionTokenService } from './session-token.service.js';

class MemoryIdentityRepository implements IdentityRepository {
  readonly accounts = new Map<string, HumanAccountRecord>();
  readonly sessions: CreateSessionInput[] = [];

  async createHumanAccount(input: CreateHumanAccountInput): Promise<HumanAccountRecord> {
    const account: HumanAccountRecord = {
      id: input.id,
      email: input.email,
      displayName: input.displayName,
      status: 'ACTIVE',
      passwordHash: input.passwordHash,
      createdAt: new Date('2026-08-02T20:36:00-03:00'),
    };
    this.accounts.set(account.email, account);
    return account;
  }

  async findHumanAccountByEmail(email: string): Promise<HumanAccountRecord | null> {
    return this.accounts.get(email) ?? null;
  }

  async createSession(input: CreateSessionInput): Promise<void> {
    this.sessions.push(input);
  }

  async findActiveSessionByTokenHash(): Promise<AuthenticatedHumanRecord | null> {
    return null;
  }

  async revokeSession(input: RevokeSessionInput): Promise<boolean> {
    const index = this.sessions.findIndex(
      (session) => session.sessionId === input.sessionId && session.accountId === input.accountId,
    );
    if (index < 0) {
      return false;
    }
    this.sessions.splice(index, 1);
    return true;
  }
}

describe('IdentityService', () => {
  it('normalizes email, creates the account and issues a session token', async () => {
    const repository = new MemoryIdentityRepository();
    const service = new IdentityService(
      repository,
      new PasswordService(),
      new SessionTokenService(),
    );

    const account = await service.registerHumanAccount(
      {
        email: '  HUMAN@Example.COM ',
        password: 'a-secure-password',
        displayName: '  Human Operator  ',
      },
      'correlation-register',
    );

    expect(account.email).toBe('human@example.com');
    expect(account.displayName).toBe('Human Operator');
    expect(repository.accounts.get(account.email)?.passwordHash).not.toContain('a-secure-password');

    const session = await service.createSession(
      'HUMAN@example.com',
      'a-secure-password',
      'correlation-session',
    );

    expect(session.token.length).toBeGreaterThan(30);
    expect(session.account.id).toBe(account.id);
    expect(repository.sessions).toHaveLength(1);
    expect(repository.sessions[0]?.tokenHash).not.toBe(session.token);

    await expect(
      service.revokeSession(session.sessionId, account.id, 'correlation-revoke'),
    ).resolves.toEqual({ revoked: true });
    expect(repository.sessions).toHaveLength(0);
  });

  it('rejects unknown accounts and incorrect passwords with the same domain error', async () => {
    const repository = new MemoryIdentityRepository();
    const service = new IdentityService(
      repository,
      new PasswordService(),
      new SessionTokenService(),
    );

    await expect(
      service.createSession('missing@example.com', 'wrong-password', 'correlation-missing'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    await service.registerHumanAccount(
      {
        email: 'known@example.com',
        password: 'correct-password',
        displayName: 'Known Human',
      },
      'correlation-register',
    );

    await expect(
      service.createSession('known@example.com', 'wrong-password', 'correlation-wrong'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
