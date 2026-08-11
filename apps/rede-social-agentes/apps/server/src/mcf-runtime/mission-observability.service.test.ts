import type { McfMissionContract } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import type {
  McfEventRecord,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import type { MissionObservabilityRepository } from './mission-observability.repository.js';
import { MissionObservabilityService } from './mission-observability.service.js';

const contract: McfMissionContract = {
  title: 'Blocked mission',
  objective: 'Observe a controlled blocked mission.',
  expectedOutcome: 'A deterministic internal alert is available.',
  scope: ['observability'],
  outOfScope: ['external notification'],
  acceptanceCriteria: ['block is visible'],
  riskClass: 'B',
  selectedAgents: ['Mestre'],
  selectedSkills: ['MCF-TRACE-MISSION'],
  sourceOfTruth: ['mcf_events'],
};

function mission(state: McfMissionRecord['state'] = 'BLOCKED_RISK'): McfMissionRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    contract,
    state,
    currentPhaseId: '22222222-2222-4222-8222-222222222222',
    currentAgentId: 'Renato',
    version: 7,
    createdAt: new Date('2026-08-10T22:00:00.000Z'),
    updatedAt: new Date('2026-08-10T22:03:00.000Z'),
  };
}

function phase(): McfPhaseRecord {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    missionId: mission().id,
    skillId: 'MCF-RUN-TESTS',
    agentId: 'Renato',
    state: 'FAILED',
    cycle: 2,
    inputs: {},
    expectedEvidence: ['ci_pass'],
    startedAt: new Date('2026-08-10T22:01:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-08-10T22:01:00.000Z'),
    updatedAt: new Date('2026-08-10T22:03:00.000Z'),
  };
}

function events(): McfEventRecord[] {
  return [
    {
      id: '33333333-3333-4333-8333-333333333333',
      missionId: mission().id,
      phaseId: phase().id,
      agentId: 'Renato',
      eventType: 'EXTERNAL_ACTION_FAILED',
      payload: { reason: 'CI_FAILED', workflowRunId: '123' },
      idempotencyKey: 'failed:123',
      occurredAt: new Date('2026-08-10T22:03:00.000Z'),
    },
  ];
}

function runtimeRepository(
  state: McfMissionRecord['state'] = 'BLOCKED_RISK',
): McfRuntimeRepository {
  return {
    createMission: vi.fn(),
    findMission: vi.fn(async () => mission(state)),
    findPhase: vi.fn(async () => phase()),
    persistExecution: vi.fn(),
    completePendingPhase: vi.fn(),
    listEvents: vi.fn(async () => events()),
  } as unknown as McfRuntimeRepository;
}

function observabilityRepository(options?: {
  missions?: McfMissionRecord[];
  inserted?: number;
  duplicates?: number;
}): MissionObservabilityRepository {
  return {
    listMissionsByStates: vi.fn(async () => options?.missions ?? [mission()]),
    appendEventsIdempotently: vi.fn(async () => ({
      inserted: options?.inserted ?? 1,
      duplicates: options?.duplicates ?? 0,
    })),
  } as unknown as MissionObservabilityRepository;
}

describe('MissionObservabilityService', () => {
  it('exposes the current phase, latest event and concrete block context', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository(),
      observabilityRepository(),
    );

    const result = await service.getMissionObservation(mission().id);

    expect(result.blocked).toBe(true);
    expect(result.currentPhase).toMatchObject({ agentId: 'Renato', state: 'FAILED', cycle: 2 });
    expect(result.latestEvent?.eventType).toBe('EXTERNAL_ACTION_FAILED');
    expect(result.blockContext).toMatchObject({
      reason: 'CI_FAILED',
      eventType: 'EXTERNAL_ACTION_FAILED',
      eventId: '33333333-3333-4333-8333-333333333333',
    });
  });

  it('does not manufacture a block context for a mission that is not blocked', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository('EXECUTING'),
      observabilityRepository({ missions: [] }),
    );

    const result = await service.getMissionObservation(mission().id);

    expect(result.blocked).toBe(false);
    expect(result.blockContext).toBeNull();
  });

  it('lists only canonical BLOCKED_RISK missions from persistent state', async () => {
    const observationRepo = observabilityRepository();
    const service = new MissionObservabilityService(runtimeRepository(), observationRepo);

    const result = await service.listBlockedMissions();

    expect(observationRepo.listMissionsByStates).toHaveBeenCalledWith(['BLOCKED_RISK']);
    expect(result.count).toBe(1);
    expect(result.sourceOfTruth).toBe('MCF_PERSISTENCE_AND_EVENT_LEDGER');
    expect(result.missions[0]).toMatchObject({
      missionId: mission().id,
      state: 'BLOCKED_RISK',
      currentAgentId: 'Renato',
      blockContext: { reason: 'CI_FAILED' },
    });
  });

  it('reconciles one idempotent internal alert per blocked mission version', async () => {
    const observationRepo = observabilityRepository();
    const service = new MissionObservabilityService(runtimeRepository(), observationRepo);

    const result = await service.reconcileBlockedAlerts();

    expect(result).toEqual({
      blockedMissionsObserved: 1,
      alertsInserted: 1,
      duplicates: 0,
      externalNotification: false,
      humanActionRequired: false,
    });
    expect(observationRepo.appendEventsIdempotently).toHaveBeenCalledWith([
      expect.objectContaining({
        missionId: mission().id,
        phaseId: phase().id,
        agentId: 'Renato',
        eventType: 'MISSION_BLOCKED_ALERT_RAISED',
        idempotencyKey: `mission:${mission().id}:blocked-alert:v7`,
        payload: expect.objectContaining({
          reason: 'CI_FAILED',
          externalNotification: false,
          humanActionRequired: false,
        }),
      }),
    ]);
  });

  it('surfaces duplicate reconciliation without producing an external effect', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository(),
      observabilityRepository({ inserted: 0, duplicates: 1 }),
    );

    const result = await service.reconcileBlockedAlerts();

    expect(result.alertsInserted).toBe(0);
    expect(result.duplicates).toBe(1);
    expect(result.externalNotification).toBe(false);
    expect(result.humanActionRequired).toBe(false);
  });
});
