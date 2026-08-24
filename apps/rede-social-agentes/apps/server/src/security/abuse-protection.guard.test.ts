import type { ExecutionContext } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { AbuseProtectionGuard } from './abuse-protection.guard.js';
import type { RateLimitService } from './rate-limit.service.js';

const cloudRoute = '/v1/mcf/context/cloud/g2a';

function context(options: {
  authorization?: string;
  ip?: string;
  peer?: string;
  route?: string;
}): ExecutionContext {
  const route = options.route ?? cloudRoute;
  const request = {
    headers: options.authorization === undefined ? {} : { authorization: options.authorization },
    id: 'abuse-guard-test-request',
    ip: options.ip ?? '198.51.100.10',
    method: 'GET',
    raw: { socket: { remoteAddress: options.peer } },
    routeOptions: { url: route },
    url: route,
  } as unknown as FastifyRequest;
  const reply = { header: vi.fn() } as unknown as FastifyReply;
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
  } as unknown as ExecutionContext;
}

function harness(): {
  consume: ReturnType<typeof vi.fn>;
  guard: AbuseProtectionGuard;
} {
  const consume = vi.fn().mockResolvedValue({
    allowed: true,
    limit: 10,
    remaining: 9,
    retryAfterSeconds: 60,
  });
  const guard = new AbuseProtectionGuard({ consume } as unknown as RateLimitService);
  return { consume, guard };
}

describe('AbuseProtectionGuard Cloud subject isolation', () => {
  it('uses one direct-peer bucket when Authorization and forwarded request IP vary', async () => {
    const { consume, guard } = harness();

    for (const [authorization, ip] of [
      ['Bearer client-selected-a', '198.51.100.11'],
      ['Bearer client-selected-b', '198.51.100.12'],
      ['Bearer client-selected-c', '198.51.100.13'],
    ] as const) {
      await expect(
        guard.canActivate(context({ authorization, ip, peer: '127.0.0.1' })),
      ).resolves.toBe(true);
    }

    expect(consume).toHaveBeenCalledTimes(3);
    for (const [subject, policy] of consume.mock.calls) {
      expect(subject).toBe('cloud-peer:127.0.0.1');
      expect(policy).toEqual({
        name: 'mcf-cloud-context-local-read',
        limit: 10,
        windowSeconds: 60,
      });
    }
  });

  it('collapses a missing peer into one fail-closed bucket without changing other routes', async () => {
    const { consume, guard } = harness();

    await expect(guard.canActivate(context({ authorization: 'Bearer ignored' }))).resolves.toBe(
      true,
    );
    await expect(
      guard.canActivate(
        context({
          authorization: 'Bearer ordinary-session',
          peer: '127.0.0.1',
          route: '/v1/posts',
        }),
      ),
    ).resolves.toBe(true);

    expect(consume.mock.calls[0]?.[0]).toBe('cloud-peer:unresolved');
    expect(consume.mock.calls[1]?.[0]).toBe('session:ordinary-session');
  });
});
