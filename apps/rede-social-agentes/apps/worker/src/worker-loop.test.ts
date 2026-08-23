import { describe, expect, it, vi } from 'vitest';

import type { ClaimedMission, MissionRunResult } from './mission-coordinator.js';
import { WorkerHealthMonitor } from './healthcheck.js';
import {
  MissionLeaseLostError,
  PersistentWorkerLoop,
  type MissionLeasePort,
} from './worker-loop.js';

function claim(): ClaimedMission {
  return {
    missionId: 'mission-001',
    missionSpecDigest: 'a'.repeat(64),
    repositoryKey: 'mcf',
    baseCommitSha: 'b'.repeat(40),
    status: 'RUNNING',
    stateVersion: 1,
    leaseToken: 'secret-lease-token',
    fencingToken: 8,
    currentStep: {
      stepKey: 'implement',
      stepOrder: 1,
      objective: 'Implement the bounded worker.',
      acceptanceCriteria: ['the worker passes its tests'],
      verificationProfiles: [],
      attempt: 1,
    },
  };
}

function completed(): MissionRunResult {
  return {
    missionId: 'mission-001',
    status: 'SUCCEEDED',
    stateVersion: 3,
    currentStep: null,
    executedStepCount: 1,
    recoveredStepCount: 0,
  };
}

describe('PersistentWorkerLoop', () => {
  it('aborts the in-flight executor immediately when heartbeat can no longer prove the lease', async () => {
    const health = new WorkerHealthMonitor('worker-001');
    let executionSignal: AbortSignal | undefined;
    const leases: MissionLeasePort = {
      claimRunnableMission: async () => claim(),
      heartbeatMission: async () => {
        throw new MissionLeaseLostError('mission-001');
      },
      recoverExpiredMissionLeases: async () => undefined,
    };
    const loop = new PersistentWorkerLoop({
      workerId: 'worker-001',
      leaseDurationMs: 5_000,
      heartbeatIntervalMs: 10,
      pollIntervalMs: 10,
      leases,
      coordinator: {
        run: async (_claim, signal) => {
          executionSignal = signal;
          return await new Promise<MissionRunResult>((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          });
        },
      },
      health,
    });

    await expect(loop.runOnce(new AbortController().signal)).rejects.toBeInstanceOf(
      MissionLeaseLostError,
    );
    expect(executionSignal?.aborted).toBe(true);
    const snapshot = health.snapshot();
    expect(snapshot.currentMissionId).toBeNull();
    expect(JSON.stringify(snapshot)).not.toContain('secret-lease-token');
  });

  it('runs one claimed mission and stops heartbeats after completion', async () => {
    const heartbeat = vi.fn(async () => ({ cancellationRequested: false }));
    const loop = new PersistentWorkerLoop({
      workerId: 'worker-001',
      leaseDurationMs: 5_000,
      heartbeatIntervalMs: 100,
      pollIntervalMs: 10,
      leases: {
        claimRunnableMission: async () => claim(),
        heartbeatMission: heartbeat,
        recoverExpiredMissionLeases: async () => undefined,
      },
      coordinator: { run: async () => completed() },
      health: new WorkerHealthMonitor('worker-001'),
    });

    expect(await loop.runOnce(new AbortController().signal)).toEqual({
      claimed: true,
      missionId: 'mission-001',
      status: 'SUCCEEDED',
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(heartbeat).not.toHaveBeenCalled();
  });

  it('recovers expired leases and stops claiming after supervised shutdown', async () => {
    const controller = new AbortController();
    let claims = 0;
    let recoveries = 0;
    const loop = new PersistentWorkerLoop({
      workerId: 'worker-001',
      leaseDurationMs: 5_000,
      heartbeatIntervalMs: 100,
      pollIntervalMs: 10,
      leases: {
        claimRunnableMission: async () => {
          claims += 1;
          controller.abort(new Error('shutdown'));
          return null;
        },
        heartbeatMission: async () => ({ cancellationRequested: false }),
        recoverExpiredMissionLeases: async () => {
          recoveries += 1;
        },
      },
      coordinator: { run: async () => completed() },
      health: new WorkerHealthMonitor('worker-001'),
    });

    await loop.run(controller.signal);
    expect(recoveries).toBeGreaterThanOrEqual(1);
    expect(claims).toBe(1);
  });
});
