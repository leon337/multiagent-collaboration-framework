import { describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database.service.js';
import type { McfEventInput } from './mcf-runtime.repository.js';
import {
  type BlockedAlertCandidate,
  MissionObservabilityRepository,
} from './mission-observability.repository.js';

interface LockedMission {
  state: string;
  version: number;
}

function database(options?: {
  lockedMissions?: Array<LockedMission | null>;
  insertRowCounts?: number[];
}): DatabaseService {
  const lockedMissions = [...(options?.lockedMissions ?? [{ state: 'BLOCKED_RISK', version: 3 }])];
  const insertRowCounts = [...(options?.insertRowCounts ?? [1])];
  const client = {
    query: vi.fn(async (sql: string) => {
      if (sql.includes('for update')) {
        const locked = lockedMissions.shift() ?? null;
        return { rows: locked ? [locked] : [], rowCount: locked ? 1 : 0 };
      }
      return { rows: [], rowCount: insertRowCounts.shift() ?? 0 };
    }),
  };

  return {
    query: vi.fn(async () => ({
      rows: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          contract: {
            title: 'Blocked mission',
            objective: 'Observe it.',
            expectedOutcome: 'Visible block.',
            scope: ['observability'],
            outOfScope: [],
            acceptanceCriteria: ['visible'],
            riskClass: 'B',
            selectedAgents: ['Mestre'],
            selectedSkills: ['MCF-TRACE-MISSION'],
            sourceOfTruth: ['mcf_events'],
          },
          state: 'BLOCKED_RISK',
          currentPhaseId: null,
          currentAgentId: 'Mestre',
          version: 3,
          createdAt: new Date('2026-08-10T22:00:00.000Z'),
          updatedAt: new Date('2026-08-10T22:02:00.000Z'),
        },
      ],
      rowCount: 1,
    })),
    transaction: vi.fn(async (work) => work(client as never)),
  } as unknown as DatabaseService;
}

function event(id: string, key: string): McfEventInput {
  return {
    id,
    missionId: '11111111-1111-4111-8111-111111111111',
    phaseId: null,
    agentId: 'Mestre',
    eventType: 'MISSION_BLOCKED_ALERT_RAISED',
    payload: { externalNotification: false },
    idempotencyKey: key,
    occurredAt: new Date('2026-08-10T22:03:00.000Z'),
  };
}

function candidate(id: string, key: string, expectedMissionVersion = 3): BlockedAlertCandidate {
  return {
    event: event(id, key),
    expectedMissionVersion,
  };
}

describe('MissionObservabilityRepository', () => {
  it('queries canonical mission persistence by state in deterministic order', async () => {
    const db = database();
    const repository = new MissionObservabilityRepository(db);

    const result = await repository.listMissionsByStates(['BLOCKED_RISK']);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ state: 'BLOCKED_RISK', version: 3 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('order by "updated_at" asc, "id" asc'),
      [['BLOCKED_RISK']],
    );
  });

  it('locks the mission row before inserting and counts duplicate idempotency conflicts', async () => {
    const db = database({
      lockedMissions: [
        { state: 'BLOCKED_RISK', version: 3 },
        { state: 'BLOCKED_RISK', version: 3 },
      ],
      insertRowCounts: [1, 0],
    });
    const repository = new MissionObservabilityRepository(db);

    const result = await repository.appendBlockedAlertsAtomically([
      candidate('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alert:a'),
      candidate('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'alert:b'),
    ]);

    expect(result).toEqual({ inserted: 1, duplicates: 1, stale: 0 });
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('skips a stale alert when state or version changed before the locked recheck', async () => {
    const db = database({
      lockedMissions: [
        { state: 'EXECUTING', version: 4 },
        { state: 'BLOCKED_RISK', version: 4 },
      ],
      insertRowCounts: [],
    });
    const repository = new MissionObservabilityRepository(db);

    const result = await repository.appendBlockedAlertsAtomically([
      candidate('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alert:state-stale'),
      candidate('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'alert:version-stale'),
    ]);

    expect(result).toEqual({ inserted: 0, duplicates: 0, stale: 2 });
  });

  it('does not touch persistence when there is nothing to reconcile', async () => {
    const db = database();
    const repository = new MissionObservabilityRepository(db);

    await expect(repository.appendBlockedAlertsAtomically([])).resolves.toEqual({
      inserted: 0,
      duplicates: 0,
      stale: 0,
    });
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
