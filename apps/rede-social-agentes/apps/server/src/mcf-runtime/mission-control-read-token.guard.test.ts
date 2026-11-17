import type { ExecutionContext } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';
import { McfMissionControlReadTokenGuard } from './mission-control-read-token.guard.js';

const readToken = 'independent-read-only-mission-control-test-token-001';
const dispatchToken = 'independent-dispatch-mission-control-test-token-001';

function context(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: authorization ? { authorization } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('McfMissionControlReadTokenGuard', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgresql://rsa:rsa@127.0.0.1:5432/rsa');
    vi.stubEnv('MCF_MISSION_CONTROL_TOKEN', dispatchToken);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('is disabled without explicit independent read-only credential', () => {
    vi.stubEnv('MCF_MISSION_CONTROL_READ_TOKEN', undefined);
    const guard = new McfMissionControlReadTokenGuard();
    expect(() => guard.canActivate(context())).toThrow(
      'Mission Control read-only access is not configured.',
    );
    expect(() => guard.canActivate(context(`Bearer ${dispatchToken}`))).toThrow();
  });

  it('permits only the exact read credential and never inherits dispatch authority', () => {
    vi.stubEnv('MCF_MISSION_CONTROL_READ_TOKEN', readToken);
    const reader = new McfMissionControlReadTokenGuard();
    const dispatcher = new McfMissionControlTokenGuard();
    expect(reader.canActivate(context(`Bearer ${readToken}`))).toBe(true);
    for (const value of [undefined, '', 'Basic token', `Bearer ${dispatchToken}`]) {
      expect(() => reader.canActivate(context(value))).toThrow();
    }
    expect(dispatcher.canActivate(context(`Bearer ${dispatchToken}`))).toBe(true);
    expect(() => dispatcher.canActivate(context(`Bearer ${readToken}`))).toThrow();
  });
});
