import { randomUUID } from 'node:crypto';
import { OperationError } from './execution.js';

export type BrowserRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type BrowserRunRequest = {
  url: string;
  goal: string;
  maxSteps?: number;
  maxDurationMs?: number;
};

export type BrowserRunSnapshot = {
  runId: string;
  status: BrowserRunStatus;
  runtime: 'deterministic-mvp';
  url: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  budget: {
    maxSteps: number;
    maxDurationMs: number;
    consumedSteps: number;
  };
  result?: {
    summary: string;
  };
};

export interface BrowserRuntime {
  start(request: BrowserRunRequest): BrowserRunSnapshot;
  get(runId: string): BrowserRunSnapshot;
  cancel(runId: string): BrowserRunSnapshot;
}

function parseBrowserUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OperationError('INVALID_URL', 'url must be an absolute HTTP or HTTPS URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new OperationError('INVALID_URL', 'only http and https URLs are allowed');
  }
  if (url.username || url.password) {
    throw new OperationError('INVALID_URL', 'embedded URL credentials are not allowed');
  }
  return url;
}

function cloneSnapshot(snapshot: BrowserRunSnapshot): BrowserRunSnapshot {
  return {
    ...snapshot,
    budget: { ...snapshot.budget },
    result: snapshot.result ? { ...snapshot.result } : undefined,
  };
}

export class DeterministicBrowserRuntime implements BrowserRuntime {
  private readonly runs = new Map<string, BrowserRunSnapshot>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly completionDelayMs = 5) {}

  start(request: BrowserRunRequest): BrowserRunSnapshot {
    const url = parseBrowserUrl(request.url);
    const goal = request.goal.trim();
    if (!goal || goal.length > 2_000) {
      throw new OperationError('INVALID_ARGUMENT', 'goal must contain between 1 and 2000 characters');
    }

    const maxSteps = request.maxSteps ?? 30;
    const maxDurationMs = request.maxDurationMs ?? 120_000;
    if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 500) {
      throw new OperationError('INVALID_ARGUMENT', 'maxSteps must be an integer between 1 and 500');
    }
    if (!Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 900_000) {
      throw new OperationError('INVALID_ARGUMENT', 'maxDurationMs must be an integer between 1 and 900000');
    }

    const now = new Date().toISOString();
    const runId = randomUUID();
    const snapshot: BrowserRunSnapshot = {
      runId,
      status: 'PENDING',
      runtime: 'deterministic-mvp',
      url: url.toString(),
      goal,
      createdAt: now,
      updatedAt: now,
      budget: { maxSteps, maxDurationMs, consumedSteps: 0 },
    };
    this.runs.set(runId, snapshot);

    const timer = setTimeout(() => {
      const current = this.runs.get(runId);
      if (!current || current.status !== 'PENDING') return;
      this.runs.set(runId, {
        ...current,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
        budget: { ...current.budget, consumedSteps: 1 },
        result: {
          summary: 'Deterministic MVP completed without live browser execution.',
        },
      });
      this.timers.delete(runId);
    }, Math.max(0, this.completionDelayMs));
    this.timers.set(runId, timer);

    return cloneSnapshot(snapshot);
  }

  get(runId: string): BrowserRunSnapshot {
    const snapshot = this.runs.get(runId);
    if (!snapshot) {
      throw new OperationError('RUN_NOT_FOUND', `browser run not found: ${runId}`);
    }
    return cloneSnapshot(snapshot);
  }

  cancel(runId: string): BrowserRunSnapshot {
    const current = this.runs.get(runId);
    if (!current) {
      throw new OperationError('RUN_NOT_FOUND', `browser run not found: ${runId}`);
    }

    if (current.status === 'COMPLETED' || current.status === 'FAILED' || current.status === 'CANCELLED') {
      return cloneSnapshot(current);
    }

    const timer = this.timers.get(runId);
    if (timer) clearTimeout(timer);
    this.timers.delete(runId);

    const cancelled: BrowserRunSnapshot = {
      ...current,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };
    this.runs.set(runId, cancelled);
    return cloneSnapshot(cancelled);
  }
}
