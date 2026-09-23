import type { BudgetUsage, EvidenceItem, ExecutionEnvelope } from './contracts.js';

export type ExecuteEnvelopeOptions = {
  evidence?: EvidenceItem[];
  budget?: BudgetUsage;
  errorCode?: string;
};

export class OperationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OperationError';
  }
}

export async function executeEnvelope<T>(
  operation: string,
  fn: () => Promise<T> | T,
  options: ExecuteEnvelopeOptions = {},
): Promise<ExecutionEnvelope<T>> {
  const startedAt = new Date();
  const started = performance.now();

  try {
    const data = await fn();
    const finishedAt = new Date();

    return {
      ok: true,
      operation,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: Math.max(0, performance.now() - started),
      evidence: options.evidence ?? [],
      budget: options.budget ?? {},
      data,
    };
  } catch (error) {
    const finishedAt = new Date();
    const message = error instanceof Error ? error.message : 'Unknown operation failure';
    const code = error instanceof OperationError ? error.code : (options.errorCode ?? 'OPERATION_FAILED');

    return {
      ok: false,
      operation,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: Math.max(0, performance.now() - started),
      evidence: options.evidence ?? [],
      budget: options.budget ?? {},
      error: { code, message },
    };
  }
}
