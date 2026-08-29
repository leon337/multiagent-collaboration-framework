import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';

const token = 'mission-control-test-token-with-at-least-32-characters';

function context(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: authorization ? { authorization } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('McfMissionControlTokenGuard', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgresql://rsa:rsa@127.0.0.1:5432/rsa');
    vi.stubEnv('MCF_MISSION_CONTROL_TOKEN', token);
  });

  it('accepts the exact dedicated Bearer credential', () => {
    expect(new McfMissionControlTokenGuard().canActivate(context(`Bearer ${token}`))).toBe(true);
  });

  it.each([undefined, '', 'Basic abc', 'Bearer wrong-token-value-with-enough-length'])(
    'rejects an invalid authorization header: %s',
    (authorization) => {
      expect(() => new McfMissionControlTokenGuard().canActivate(context(authorization))).toThrow();
    },
  );
});
