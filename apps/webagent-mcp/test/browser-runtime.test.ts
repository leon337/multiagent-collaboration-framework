import { describe, expect, it } from 'vitest';
import { DeterministicBrowserRuntime } from '../src/browser-runtime.js';
import { OperationError } from '../src/execution.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('DeterministicBrowserRuntime', () => {
  it('creates a stable run ID and completes asynchronously with replay metadata', async () => {
    const runtime = new DeterministicBrowserRuntime(5);
    const started = runtime.start({ url: 'https://example.com/', goal: 'inspect the page' });

    expect(started.runId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(started.runtime).toBe('deterministic-mvp');
    expect(started.status).toBe('PENDING');
    expect(runtime.get(started.runId).runId).toBe(started.runId);

    await sleep(15);
    const completed = runtime.get(started.runId);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.result?.summary).toContain('without live browser execution');
    expect(completed.result?.evidence?.version).toBe(1);
    expect(completed.result?.evidence?.screenshot).toBeUndefined();
    expect(completed.result?.evidence?.semantic).toBeUndefined();
    expect(completed.result?.evidence?.timeline.map((event) => event.type)).toEqual([
      'run.created',
      'run.completed',
    ]);
    expect(completed.result?.evidence?.replay.version).toBe(1);
    expect(completed.result?.evidence?.replay.outcome.status).toBe('COMPLETED');
    expect(completed.result?.evidence?.replay.request.goal).toBe('inspect the page');
  });

  it('returns RUN_NOT_FOUND semantics for an unknown run', () => {
    const runtime = new DeterministicBrowserRuntime();

    try {
      runtime.get('missing-run');
      throw new Error('expected RUN_NOT_FOUND');
    } catch (error) {
      expect(error).toBeInstanceOf(OperationError);
      expect((error as OperationError).code).toBe('RUN_NOT_FOUND');
    }
  });

  it('cancels a non-terminal run and keeps it cancelled', async () => {
    const runtime = new DeterministicBrowserRuntime(50);
    const started = runtime.start({ url: 'https://example.com/', goal: 'inspect' });

    const cancelled = runtime.cancel(started.runId);
    expect(cancelled.status).toBe('CANCELLED');

    await sleep(60);
    expect(runtime.get(started.runId).status).toBe('CANCELLED');
  });

  it('does not rewrite a completed run when cancel is called', async () => {
    const runtime = new DeterministicBrowserRuntime(1);
    const started = runtime.start({ url: 'https://example.com/', goal: 'inspect' });

    await sleep(10);
    expect(runtime.get(started.runId).status).toBe('COMPLETED');
    expect(runtime.cancel(started.runId).status).toBe('COMPLETED');
  });
});
