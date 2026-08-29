import { describe, expect, it, vi } from 'vitest';

import type { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import type { MissionControlRepository } from './mission-control.repository.js';
import { MissionControlService } from './mission-control.service.js';
import type { MissionObservabilityService } from './mission-observability.service.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';

const mission = {
  id: '11111111-1111-4111-8111-111111111111',
  contract: {
    title: 'Mission Control',
    objective: 'Create one observable mission from ChatGPT.',
    expectedOutcome: 'Mission appears in TriView.',
    scope: ['chat'],
    outOfScope: [],
    acceptanceCriteria: ['visible'],
    riskClass: 'A' as const,
    selectedAgents: ['Mestre'],
    selectedSkills: ['MCF-START-MISSION'],
    sourceOfTruth: [],
  },
  state: 'EXECUTING' as const,
  currentPhaseId: null,
  currentAgentId: 'Mestre',
  version: 1,
  createdAt: '2026-08-28T00:00:00.000Z',
  updatedAt: '2026-08-28T00:00:00.000Z',
};

describe('MissionControlService', () => {
  it('marks GPT Action provenance and a normalized repository channel', async () => {
    const dispatch = vi.fn(async (request) => ({ mission, request }));
    const service = new MissionControlService(
      { dispatch } as unknown as ChatRuntimeBridgeService,
      {} as MissionRuntimeService,
      {} as MissionObservabilityService,
      {} as MissionControlRepository,
    );

    await service.dispatch({
      objective: 'Start a mission from the visible ChatGPT conversation.',
      repository: 'Leon337/MultiAgent-Collaboration-Framework',
      sourceOfTruth: ['user-message'],
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceOfTruth: [
          'user-message',
          'chat-surface:chatgpt-gpt-action',
          'mission-control-repository:leon337/multiagent-collaboration-framework',
        ],
      }),
    );
  });

  it('returns one composed read-only snapshot for the latest matching mission', async () => {
    const timeline = { mission, events: [] };
    const observability = {
      mission,
      currentPhase: null,
      latestEvent: null,
      blocked: false,
      blockContext: null,
    };
    const findLatestMissionId = vi.fn(async () => mission.id);
    const service = new MissionControlService(
      {} as ChatRuntimeBridgeService,
      { timeline: vi.fn(async () => timeline) } as unknown as MissionRuntimeService,
      {
        getMissionObservation: vi.fn(async () => observability),
      } as unknown as MissionObservabilityService,
      { findLatestMissionId } as unknown as MissionControlRepository,
    );

    await expect(service.latest('Leon337/MultiAgent-Collaboration-Framework')).resolves.toEqual({
      source: 'MCF_MISSION_CONTROL_READ_ONLY',
      repository: 'leon337/multiagent-collaboration-framework',
      mission,
      timeline,
      observability,
    });
    expect(findLatestMissionId).toHaveBeenCalledWith(
      'mission-control-repository:leon337/multiagent-collaboration-framework',
    );
  });

  it('returns null instead of manufacturing a mission', async () => {
    const service = new MissionControlService(
      {} as ChatRuntimeBridgeService,
      {} as MissionRuntimeService,
      {} as MissionObservabilityService,
      { findLatestMissionId: vi.fn(async () => null) } as unknown as MissionControlRepository,
    );
    await expect(service.latest('leon337/example')).resolves.toBeNull();
  });
});
