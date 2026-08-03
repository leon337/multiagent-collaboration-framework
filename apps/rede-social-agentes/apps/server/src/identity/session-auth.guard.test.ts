import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedHumanRequest } from './authenticated-request.js';
import type { IdentityRepository } from './identity.repository.js';
import { SessionAuthGuard } from './session-auth.guard.js';
import { SessionTokenService } from './session-token.service.js';

function contextFor(request: FastifyRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SessionAuthGuard', () => {
  it('rejects a missing bearer token with a correlated error', async () => {
    const repository = {
      findActiveSessionByTokenHash: vi.fn(),
    } as unknown as IdentityRepository;
    const guard = new SessionAuthGuard(repository, new SessionTokenService());
    const request = { id: 'correlation-missing', headers: {} } as unknown as FastifyRequest;

    await expect(guard.canActivate(contextFor(request))).rejects.toMatchObject({
      response: {
        code: 'INVALID_SESSION',
        correlationId: 'correlation-missing',
      },
    });
  });

  it('attaches the authenticated human for an active session', async () => {
    const authenticatedHuman = {
      accountId: 'account-1',
      email: 'human@example.test',
      displayName: 'Human',
      sessionId: 'session-1',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    };
    const repository = {
      findActiveSessionByTokenHash: vi.fn().mockResolvedValue(authenticatedHuman),
    } as unknown as IdentityRepository;
    const tokens = new SessionTokenService();
    const guard = new SessionAuthGuard(repository, tokens);
    const request = {
      id: 'correlation-valid',
      headers: { authorization: 'Bearer raw-session-token' },
    } as unknown as FastifyRequest;

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(repository.findActiveSessionByTokenHash).toHaveBeenCalledWith(
      tokens.hash('raw-session-token'),
    );
    expect((request as AuthenticatedHumanRequest).authenticatedHuman).toEqual(authenticatedHuman);
  });

  it('rejects an expired, revoked or unknown session uniformly', async () => {
    const repository = {
      findActiveSessionByTokenHash: vi.fn().mockResolvedValue(null),
    } as unknown as IdentityRepository;
    const guard = new SessionAuthGuard(repository, new SessionTokenService());
    const request = {
      id: 'correlation-invalid',
      headers: { authorization: 'Bearer invalid-token' },
    } as unknown as FastifyRequest;

    const error = await guard.canActivate(contextFor(request)).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(UnauthorizedException);
  });
});
