export type EvidenceKind = 'source' | 'request' | 'runtime';

export type EvidenceItem = {
  kind: EvidenceKind;
  ref: string;
  detail?: string;
};

export type BudgetUsage = {
  maxSteps?: number;
  maxDurationMs?: number;
  consumedSteps?: number;
};

export type ExecutionError = {
  code: string;
  message: string;
};

export type ExecutionEnvelope<T> = {
  ok: boolean;
  operation: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  evidence: EvidenceItem[];
  budget: BudgetUsage;
  data?: T;
  error?: ExecutionError;
};
