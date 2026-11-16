import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { McfMissionControlReadTokenGuard } from './mission-control-read-token.guard.js';
import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';

const readToken = 'mcf-read-only-token-with-at-least-32-characters';
const dispatchToken = 'mcf-dispatch-token-with-at-least-32-characters';

function requestContext(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: authorization ? { authorization } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('McfMissionControlReadTokenGuard (least privilege)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('DATABASE_URL', 'postgresql://rsa:rsa@127.0.0.1:5432/rsa');
    vi.stubEnv('MCF_MISSION_CONTROL_TOKEN', dispatchToken);
    vi.stubEnv('MCF_MISSION_CONTROL_READ_TOKEN', readToken);
  });

  it('admits a matching, dedicated read-only token', () => {
    expect(new McfMissionControlReadTokenGuard().canActivate(requestContext('Bearer ' + readToken)))
      .toBe(true);
  });

  it('rejects the dispatch token on the read-only route', () => {
    expect(() =>
      new McfMissionControlReadTokenGuard().canActivate(requestContext('Bearer ' + dispatchToken)),
    ).toThrow();
  });

  it('rejects the read-only token on the dispatch route', () => {
    expect(() =>
      new McfMissionControlTokenGuard().canActivate(requestContext('Bearer ' + readToken)),
    ).toThrow();
  });

  it.each([undefined, '', 'Basic abc', 'Bearer incorrect-credential', 'Bearer '])(
    'fails closed for missing/invalid authorization %s',
    (authorization) => {
      expect(() =>
        new McfMissionControlReadTokenGuard().canActivate(requestContext(authorization)),
      ).toThrow();
    },
  );

  it('stays disabled when no read-only token is configured', () => {
    vi.stubEnv('MCF_MISSION_CONTROL_READ_TOKEN', '');
    expect(() =>
      new McfMissionControlReadTokenGuard().canActivate(requestContext('Bearer ' + readToken)),
    ).toThrow();
  });
});
