import { describe, expect, it, vi } from 'vitest';
import { InitialHumanBootstrapController } from './initial-human-bootstrap.controller.js';

describe('InitialHumanBootstrapController', () => {
  it('rejects requests without the bootstrap bearer token', async () => {
    const service = { register: vi.fn() };
    const controller = new InitialHumanBootstrapController(service as never);
    const request = { id: 'corr-1', headers: {} } as never;

    await expect(
      controller.register({ password: 'valid-password-123', displayName: 'Leandro' }, request),
    ).rejects.toThrow(/registration token/iu);
    expect(service.register).not.toHaveBeenCalled();
  });

  it('delegates only password/displayName plus the bearer token and correlation id', async () => {
    const result = { sessionId: 'session', token: 'session-token' };
    const service = { register: vi.fn().mockResolvedValue(result) };
    const controller = new InitialHumanBootstrapController(service as never);
    const request = {
      id: 'corr-2',
      headers: { authorization: 'Bearer bootstrap-registration-token' },
    } as never;

    await expect(
      controller.register({ password: 'valid-password-123', displayName: ' Leandro ' }, request),
    ).resolves.toBe(result);
    expect(service.register).toHaveBeenCalledWith(
      { password: 'valid-password-123', displayName: 'Leandro' },
      'bootstrap-registration-token',
      expect.any(Date),
      'corr-2',
    );
  });
  it('rejects caller-supplied identity fields instead of silently ignoring them', async () => {
    const service = { register: vi.fn() };
    const controller = new InitialHumanBootstrapController(service as never);
    const request = {
      id: 'corr-3',
      headers: { authorization: 'Bearer bootstrap-registration-token' },
    } as never;

    await expect(
      controller.register(
        {
          password: 'valid-password-123',
          displayName: 'Leandro',
          email: 'attacker@example.test',
          accountId: '11111111-1111-4111-8111-111111111111',
        } as never,
        request,
      ),
    ).rejects.toThrow();
    expect(service.register).not.toHaveBeenCalled();
  });
});
