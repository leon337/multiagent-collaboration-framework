import { chmod, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { AtomicCheckpointStore, type StepResultMarker } from './checkpoint.js';
import {
  MissionCoordinator,
  MissionStateConflictError,
  type ClaimedMission,
  type MissionProgress,
  type MissionStatePort,
  type MissionStepExecutionInput,
  type MissionStepExecutionOutput,
  type MissionStepTransition,
} from './mission-coordinator.js';

const temporaryDirectories: string[] = [];
const NOW = new Date('2026-08-22T12:00:00.000Z');

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })),
  );
});

async function checkpoints(): Promise<AtomicCheckpointStore> {
  const root = await mkdtemp(`${os.tmpdir()}/mcf-coordinator-`);
  temporaryDirectories.push(root);
  await chmod(root, 0o700);
  return new AtomicCheckpointStore({ root });
}

function step(stepKey = 'implement', stepOrder = 1) {
  return {
    stepKey,
    stepOrder,
    objective: `Execute ${stepKey}.`,
    acceptanceCriteria: [`${stepKey} is complete`],
    verificationProfiles: [],
    attempt: 1,
  };
}

function claimed(overrides: Partial<ClaimedMission> = {}): ClaimedMission {
  return {
    missionId: 'mission-001',
    missionSpecDigest: 'a'.repeat(64),
    repositoryKey: 'mcf',
    baseCommitSha: 'b'.repeat(40),
    status: 'RUNNING',
    stateVersion: 1,
    leaseToken: 'lease-001',
    fencingToken: 11,
    currentStep: step(),
    ...overrides,
  };
}

function executionOutput(summary = 'Step completed.'): MissionStepExecutionOutput {
  return {
    outcome: 'COMPLETED',
    summary,
    changedFiles: ['apps/worker/src/example.ts'],
    patchDigest: 'c'.repeat(64),
    artifacts: [],
    validations: [],
    completedAt: NOW.toISOString(),
  };
}

class FakeMissionStore implements MissionStatePort {
  current = claimed();
  completeCalls = 0;
  failCompletionOnce = false;
  readonly remainingSteps: ReturnType<typeof step>[] = [];

  async beginStep(input: {
    missionId: string;
    stepKey: string;
    leaseToken: string;
    fencingToken: number;
    expectedStateVersion: number;
    executionKey: string;
  }): Promise<MissionStepTransition> {
    this.#fence(input);
    if (this.current.currentStep?.stepKey !== input.stepKey) {
      throw new MissionStateConflictError('step is no longer current');
    }
    const currentStep = this.current.currentStep;
    this.current = { ...this.current, stateVersion: this.current.stateVersion + 1 };
    return { stateVersion: this.current.stateVersion, step: currentStep };
  }

  async completeStepAtomic(input: {
    missionId: string;
    stepKey: string;
    leaseToken: string;
    fencingToken: number;
    expectedStateVersion: number;
    executionKey: string;
    result: StepResultMarker;
    checkpoint: { path: string; sha256: string; bytes: number };
  }): Promise<MissionProgress> {
    this.#fence(input);
    this.completeCalls += 1;
    if (this.failCompletionOnce) {
      this.failCompletionOnce = false;
      throw new Error('simulated process crash after durable result marker');
    }
    const next = this.remainingSteps.shift() ?? null;
    this.current = {
      ...this.current,
      stateVersion: this.current.stateVersion + 1,
      status: next === null ? 'SUCCEEDED' : 'RUNNING',
      currentStep: next,
    };
    return this.current;
  }

  async failStep(): Promise<MissionProgress> {
    this.current = { ...this.current, stateVersion: this.current.stateVersion + 1, status: 'FAILED' };
    return this.current;
  }

  async yieldMission(): Promise<MissionProgress> {
    return this.current;
  }

  recoverLease(leaseToken: string, fencingToken: number): ClaimedMission {
    this.current = { ...this.current, leaseToken, fencingToken };
    return this.current;
  }

  #fence(input: {
    missionId: string;
    leaseToken: string;
    fencingToken: number;
    expectedStateVersion: number;
  }): void {
    if (
      input.missionId !== this.current.missionId ||
      input.leaseToken !== this.current.leaseToken ||
      input.fencingToken !== this.current.fencingToken ||
      input.expectedStateVersion !== this.current.stateVersion
    ) {
      throw new MissionStateConflictError('CAS or fencing token rejected');
    }
  }
}

describe('MissionCoordinator', () => {
  it('recovers a durable result after a crash without executing the completed step twice', async () => {
    const checkpointStore = await checkpoints();
    const state = new FakeMissionStore();
    state.failCompletionOnce = true;
    let executions = 0;
    const coordinator = new MissionCoordinator({
      state,
      checkpoints: checkpointStore,
      worktrees: {
        ensure: async () => ({
          path: '/srv/mcf/worktrees/mission-001',
          baseCommitSha: 'b'.repeat(40),
        }),
      },
      executor: {
        execute: async (_input: MissionStepExecutionInput) => {
          executions += 1;
          return executionOutput();
        },
      },
      now: () => NOW,
    });

    await expect(coordinator.run(state.current, new AbortController().signal)).rejects.toThrow(
      /simulated process crash/u,
    );
    expect(executions).toBe(1);

    const recoveredClaim = state.recoverLease('lease-002', 12);
    const result = await coordinator.run(recoveredClaim, new AbortController().signal);

    expect(result.status).toBe('SUCCEEDED');
    expect(result.recoveredStepCount).toBe(1);
    expect(executions).toBe(1);
  });

  it('executes multiple bounded steps in order in the same persistent worktree', async () => {
    const state = new FakeMissionStore();
    state.remainingSteps.push(step('verify', 2));
    const seen: string[] = [];
    const coordinator = new MissionCoordinator({
      state,
      checkpoints: await checkpoints(),
      worktrees: {
        ensure: async () => ({
          path: '/srv/mcf/worktrees/mission-001',
          baseCommitSha: 'b'.repeat(40),
        }),
      },
      executor: {
        execute: async (input) => {
          seen.push(`${input.step.stepKey}:${input.worktreePath}`);
          return executionOutput(input.step.stepKey);
        },
      },
      maximumStepsPerRun: 8,
      now: () => NOW,
    });

    const result = await coordinator.run(state.current, new AbortController().signal);
    expect(result.status).toBe('SUCCEEDED');
    expect(result.executedStepCount).toBe(2);
    expect(seen).toEqual([
      'implement:/srv/mcf/worktrees/mission-001',
      'verify:/srv/mcf/worktrees/mission-001',
    ]);
  });

  it('uses CAS and fencing so concurrent coordinators cannot execute the same step', async () => {
    const state = new FakeMissionStore();
    let executions = 0;
    const checkpointStore = await checkpoints();
    const makeCoordinator = () =>
      new MissionCoordinator({
        state,
        checkpoints: checkpointStore,
        worktrees: {
          ensure: async () => ({
            path: '/srv/mcf/worktrees/mission-001',
            baseCommitSha: 'b'.repeat(40),
          }),
        },
        executor: {
          execute: async () => {
            executions += 1;
            return executionOutput();
          },
        },
        now: () => NOW,
      });
    const staleClaim = state.current;

    const outcomes = await Promise.allSettled([
      makeCoordinator().run(staleClaim, new AbortController().signal),
      makeCoordinator().run(staleClaim, new AbortController().signal),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
    expect(executions).toBe(1);
  });
});
