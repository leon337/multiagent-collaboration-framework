import { describe, expect, it, vi } from 'vitest';
import { InitialHumanBootstrapService } from './initial-human-bootstrap.service.js';

describe('InitialHumanBootstrapService', () => {
  it('exists as the dedicated single-use initial human bootstrap component', () => {
    expect(typeof InitialHumanBootstrapService).toBe('function');
  });

  it('rejects an invalid registration token before expensive or mutable work', async () => {
    const repository = { createInitialHuman: vi.fn() };
    const passwords = { hash: vi.fn() };
    const tokens = { issue: vi.fn() };
    const service = new InitialHumanBootstrapService(
      repository as never,
      passwords as never,
      tokens as never,
      'authority@example.test',
      'correct-registration-token-value-00000001',
    );

    await expect(
      service.register(
        { password: 'a-valid-human-password', displayName: 'Leandro' },
        'wrong-registration-token-value-00000000',
      ),
    ).rejects.toThrow(/registration token/iu);

    expect(passwords.hash).not.toHaveBeenCalled();
    expect(tokens.issue).not.toHaveBeenCalled();
    expect(repository.createInitialHuman).not.toHaveBeenCalled();
  });

  it('creates the configured human account and returns its normal MCF session', async () => {
    const createdAt = new Date('2026-09-07T20:00:00.000Z');
    const expiresAt = new Date('2026-09-14T20:00:00.000Z');
    const repository = {
      createInitialHuman: vi.fn().mockResolvedValue({ status: 'CREATED', createdAt }),
    };
    const passwords = { hash: vi.fn().mockResolvedValue('scrypt$v1$hash') };
    const tokens = {
      issue: vi.fn().mockReturnValue({
        sessionId: '33333333-3333-4333-8333-333333333333',
        token: 'session-token',
        tokenHash: 'session-token-hash',
        expiresAt,
      }),
    };
    const service = new InitialHumanBootstrapService(
      repository as never,
      passwords as never,
      tokens as never,
      'AUTHORITY@EXAMPLE.TEST',
      'correct-registration-token-value-00000001',
    );

    const result = await service.register(
      { password: 'a-valid-human-password', displayName: ' Leandro ' },
      'correct-registration-token-value-00000001',
      createdAt,
    );
    const persisted = repository.createInitialHuman.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(persisted.email).toBe('authority@example.test');
    expect(persisted.displayName).toBe('Leandro');
    expect(persisted.passwordHash).toBe('scrypt$v1$hash');
    expect(persisted.sessionId).toBe('33333333-3333-4333-8333-333333333333');
    expect(persisted.tokenHash).toBe('session-token-hash');
    expect(result.account.id).toBe(persisted.accountId);
    expect(result.account.email).toBe('authority@example.test');
    expect(result.token).toBe('session-token');
    expect(result.expiresAt).toBe(expiresAt.toISOString());
    expect('passwordHash' in result.account).toBe(false);
  });

  it('fails closed when an account already exists', async () => {
    const repository = {
      createInitialHuman: vi.fn().mockResolvedValue({ status: 'ALREADY_INITIALIZED' }),
    };
    const passwords = { hash: vi.fn().mockResolvedValue('scrypt$v1$hash') };
    const tokens = {
      issue: vi.fn().mockReturnValue({
        sessionId: '33333333-3333-4333-8333-333333333333',
        token: 'session-token',
        tokenHash: 'session-token-hash',
        expiresAt: new Date('2026-09-14T20:00:00.000Z'),
      }),
    };
    const service = new InitialHumanBootstrapService(
      repository as never,
      passwords as never,
      tokens as never,
      'authority@example.test',
      'correct-registration-token-value-00000001',
    );

    await expect(
      service.register(
        { password: 'a-valid-human-password', displayName: 'Leandro' },
        'correct-registration-token-value-00000001',
      ),
    ).rejects.toThrow(/already been initialized/iu);
  });
});
