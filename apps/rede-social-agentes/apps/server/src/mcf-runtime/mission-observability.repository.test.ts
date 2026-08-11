import { describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database.service.js';
import type { McfEventInput } from './mcf-runtime.repository.js';
import { MissionObservabilityRepository } from './mission-observability.repository.js';

function database(options?: { rowCounts?: number[] }): DatabaseService {
  const rowCounts = [...(options?.rowCounts ?? [1])];
  const client = {
    query: vi.fn(async () => ({ rows: [], rowCount: rowCounts.shift() ?? 0 })),
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

  it('counts inserts and duplicate idempotency conflicts without a second effect', async () => {
    const db = database({ rowCounts: [1, 0] });
    const repository = new MissionObservabilityRepository(db);

    const result = await repository.appendEventsIdempotently([
      event('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'alert:a'),
      event('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'alert:b'),
    ]);

    expect(result).toEqual({ inserted: 1, duplicates: 1 });
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('does not touch persistence when there is nothing to reconcile', async () => {
    const db = database();
    const repository = new MissionObservabilityRepository(db);

    await expect(repository.appendEventsIdempotently([])).resolves.toEqual({
      inserted: 0,
      duplicates: 0,
    });
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
