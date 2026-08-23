import { chmod, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import {
  AtomicCheckpointStore,
  CheckpointConflictError,
  createStepExecutionKey,
  type StepResultMarker,
  type StepStartedMarker,
} from './checkpoint.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })),
  );
});

async function checkpointStore(): Promise<AtomicCheckpointStore> {
  const root = await mkdtemp(`${os.tmpdir()}/mcf-checkpoints-`);
  temporaryDirectories.push(root);
  await chmod(root, 0o700);
  return new AtomicCheckpointStore({ root });
}

function started(executionKey: string): StepStartedMarker {
  return {
    schemaVersion: '1.0',
    kind: 'STEP_STARTED',
    missionId: 'mission-001',
    stepKey: 'implement',
    stepOrder: 1,
    executionKey,
    attempt: 1,
    stateVersionStarted: 3,
    baseCommitSha: 'a'.repeat(40),
    worktreePath: '/srv/mcf/worktrees/mission-001',
    startedAt: '2026-08-22T12:00:00.000Z',
  };
}

function completed(executionKey: string): StepResultMarker {
  return {
    schemaVersion: '1.0',
    kind: 'STEP_RESULT',
    missionId: 'mission-001',
    stepKey: 'implement',
    stepOrder: 1,
    executionKey,
    attempt: 1,
    baseCommitSha: 'a'.repeat(40),
    worktreePath: '/srv/mcf/worktrees/mission-001',
    outcome: 'COMPLETED',
    summary: 'Implementation and validation completed.',
    changedFiles: ['apps/worker/src/example.ts'],
    patchDigest: 'b'.repeat(64),
    artifacts: [
      {
        kind: 'result',
        path: '/srv/mcf/artifacts/mission-001/result.json',
        sha256: 'c'.repeat(64),
        bytes: 42,
      },
    ],
    validations: [
      { profile: 'worker-test', status: 'PASSED', exitCode: 0, outputDigest: 'd'.repeat(64) },
    ],
    completedAt: '2026-08-22T12:05:00.000Z',
  };
}

describe('AtomicCheckpointStore', () => {
  it('publishes immutable start and result markers and reads a durable result after restart', async () => {
    const store = await checkpointStore();
    const executionKey = createStepExecutionKey({
      missionId: 'mission-001',
      missionSpecDigest: 'e'.repeat(64),
      stepKey: 'implement',
      stepOrder: 1,
    });

    const startReceipt = await store.writeStarted(started(executionKey));
    const resultReceipt = await store.writeResult(completed(executionKey));
    const restarted = new AtomicCheckpointStore({ root: store.root });

    expect(startReceipt.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(resultReceipt.path).toMatch(/step-result\.json$/u);
    expect(await restarted.readResult('mission-001', 'implement', executionKey)).toEqual(
      completed(executionKey),
    );
    expect(JSON.parse(await readFile(resultReceipt.path, 'utf8'))).toEqual(completed(executionKey));
  });

  it('is idempotent for the exact payload and refuses a conflicting replay', async () => {
    const store = await checkpointStore();
    const executionKey = 'f'.repeat(64);
    await store.writeStarted(started(executionKey));
    const first = await store.writeResult(completed(executionKey));
    const replay = await store.writeResult(completed(executionKey));
    expect(replay).toEqual(first);

    await expect(
      store.writeResult({ ...completed(executionKey), summary: 'Conflicting result.' }),
    ).rejects.toBeInstanceOf(CheckpointConflictError);
  });

  it('refuses a result without the matching durable start marker', async () => {
    const store = await checkpointStore();
    await expect(store.writeResult(completed('f'.repeat(64)))).rejects.toThrow(
      /matching start marker/u,
    );
  });

  it('keeps starts immutable per attempt so crash recovery can begin a later attempt', async () => {
    const store = await checkpointStore();
    const executionKey = 'f'.repeat(64);
    const first = started(executionKey);
    const second = {
      ...first,
      attempt: 2,
      stateVersionStarted: 4,
      startedAt: '2026-08-22T12:10:00.000Z',
    };

    const firstReceipt = await store.writeStarted(first);
    const secondReceipt = await store.writeStarted(second);

    expect(firstReceipt.path).toMatch(/attempt-000001/u);
    expect(secondReceipt.path).toMatch(/attempt-000002/u);
    expect(await store.readStarted('mission-001', 'implement', 1)).toEqual(first);
    expect(await store.readStarted('mission-001', 'implement', 2)).toEqual(second);
  });
});
