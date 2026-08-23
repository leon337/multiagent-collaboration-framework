import type { McfWorkFailure, McfWorkJobStatus } from '@rsa/contracts';

export interface McfRetryDecision {
  status: Extract<McfWorkJobStatus, 'RETRY_WAIT' | 'FAILED' | 'DEAD'>;
  nextAttemptAt: Date | null;
}

export interface McfRetryPolicyOptions {
  baseDelayMs?: number | undefined;
  maximumDelayMs?: number | undefined;
  jitterRatio?: number | undefined;
  random?: (() => number) | undefined;
}

export function decideMcfWorkRetry(input: {
  failure: McfWorkFailure;
  attemptCount: number;
  maxAttempts: number;
  now: Date;
  options?: McfRetryPolicyOptions | undefined;
}): McfRetryDecision {
  if (!input.failure.retryable || input.failure.kind === 'POLICY' || input.failure.kind === 'PERMANENT') {
    return { status: 'FAILED', nextAttemptAt: null };
  }
  if (input.attemptCount >= input.maxAttempts) {
    return { status: 'DEAD', nextAttemptAt: null };
  }

  const baseDelayMs = input.options?.baseDelayMs ?? 60_000;
  const maximumDelayMs = input.options?.maximumDelayMs ?? 30 * 60_000;
  const jitterRatio = input.options?.jitterRatio ?? 0.2;
  const random = input.options?.random ?? Math.random;
  if (baseDelayMs < 1 || maximumDelayMs < baseDelayMs || jitterRatio < 0 || jitterRatio > 1) {
    throw new Error('invalid MCF retry policy options');
  }
  const exponential = Math.min(maximumDelayMs, baseDelayMs * 5 ** Math.max(0, input.attemptCount - 1));
  const jitter = exponential * jitterRatio * (random() * 2 - 1);
  const delay = Math.max(1, Math.round(exponential + jitter));
  return { status: 'RETRY_WAIT', nextAttemptAt: new Date(input.now.getTime() + delay) };
}
