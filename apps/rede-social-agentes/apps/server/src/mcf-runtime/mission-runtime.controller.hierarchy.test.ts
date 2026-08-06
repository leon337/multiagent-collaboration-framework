import type { CreateMcfMissionRequest, McfMissionResponse } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { MissionRuntimeController } from './mission-runtime.controller.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';

const parentMissionId = '3a3ee0a1-3ff4-4574-9085-0ce037bfaf2c';

function response(contract: CreateMcfMissionRequest['contract']): McfMissionResponse {
  return {
    id: '14da7e4d-33cb-4641-9c78-39702ae919c5',
    contract,
    state: 'PLANNED',
    currentPhaseId: null,
    currentAgentId: null,
    version: 1,
    createdAt: '2026-08-06T02:00:00.000Z',
    updatedAt: '2026-08-06T02:00:00.000Z',
  };
}

describe('MissionRuntimeController hierarchy validation', () => {
  it('preserves hierarchy fields passed through the HTTP request schema', async () => {
    const createMission = vi.fn(async (input: CreateMcfMissionRequest) => response(input.contract));
    const runtime = { createMission } as unknown as MissionRuntimeService;
    const controller = new MissionRuntimeController(runtime);

    await controller.createMission(
      {
        contract: {
          title: 'Controlled child mission',
          objective: 'Execute a controlled child flow and return to the parent mission.',
          expectedOutcome: 'The parent mission receives the validated return.',
          scope: ['hierarchy'],
          outOfScope: [],
          acceptanceCriteria: ['return is persisted'],
          riskClass: 'B',
          selectedAgents: ['Emily'],
          selectedSkills: ['MCF-TRACE-MISSION'],
          sourceOfTruth: ['MCF-DEC-059'],
          parentMissionId,
          returnToAgentId: 'Leonardo',
          returnStatus: 'PENDING',
        },
      },
      { id: 'correlation-hierarchy-test' } as never,
    );

    expect(createMission).toHaveBeenCalledWith({
      contract: expect.objectContaining({
        parentMissionId,
        returnToAgentId: 'Leonardo',
        returnStatus: 'PENDING',
      }),
    });
  });
});
