import { describe, expect, it } from 'vitest';

import type { McfWorkFailure } from '@rsa/contracts';

import { decideMcfWorkRetry } from './retry-policy.js';

const transient: McfWorkFailure = {
  code: 'CODEX_RATE_LIMITED',
  message: 'Codex temporarily rate limited the request.',
  kind: 'TRANSIENT',
  retryable: true,
  statusCode: 429,
};

describe('MCF work retry policy', () => {
  it('schedules bounded exponential retry with deterministic jitter injection', () => {
    const now = new Date('2026-08-22T12:00:00.000Z');
    const decision = decideMcfWorkRetry({
      failure: transient,
      attemptCount: 2,
      maxAttempts: 3,
      now,
      options: { baseDelayMs: 1_000, maximumDelayMs: 30_000, jitterRatio: 0.2, random: () => 0.5 },
    });

    expect(decision).toEqual({
      status: 'RETRY_WAIT',
      nextAttemptAt: new Date('2026-08-22T12:00:05.000Z'),
    });
  });

  it('moves an exhausted retryable failure to DEAD', () => {
    expect(
      decideMcfWorkRetry({ failure: transient, attemptCount: 3, maxAttempts: 3, now: new Date() }),
    ).toEqual({ status: 'DEAD', nextAttemptAt: null });
  });

  it('fails policy and permanent failures without retry', () => {
    const policy: McfWorkFailure = {
      code: 'WRITE_SCOPE_VIOLATION',
      message: 'A changed file escaped the declared scope.',
      kind: 'POLICY',
      retryable: true,
    };
    expect(
      decideMcfWorkRetry({ failure: policy, attemptCount: 1, maxAttempts: 3, now: new Date() }),
    ).toEqual({ status: 'FAILED', nextAttemptAt: null });
  });

  it('rejects unsafe retry policy configuration', () => {
    expect(() =>
      decideMcfWorkRetry({
        failure: transient,
        attemptCount: 1,
        maxAttempts: 3,
        now: new Date(),
        options: { baseDelayMs: 10, maximumDelayMs: 1 },
      }),
    ).toThrow(/invalid MCF retry policy/u);
  });
});
