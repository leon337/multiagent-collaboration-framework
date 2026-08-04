import type { McfMissionResponse, McfPhaseExecutionResponse } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';
import { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';

function mission(): McfMissionResponse {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    contract: {
      title: 'Implementar ponte segura',
      objective: 'Implementar uma ponte segura entre o chat e o runtime.',
      expectedOutcome: 'Resultado verificável.',
      scope: ['chat-to-runtime-bridge'],
      outOfScope: ['human-as-technical-operator'],
      acceptanceCriteria: ['missão persistida'],
      riskClass: 'B',
      selectedAgents: ['Mestre', 'Miriam', 'Rafael', 'Vinicius', 'Renato', 'Emily'],
      selectedSkills: ['MCF-START-MISSION', 'MCF-IMPLEMENT-CHANGE', 'MCF-RUN-TESTS'],
      sourceOfTruth: ['chat-objective'],
    },
    state: 'PLANNED',
    currentPhaseId: null,
    currentAgentId: null,
    version: 1,
    createdAt: '2026-08-04T22:00:00.000Z',
    updatedAt: '2026-08-04T22:00:00.000Z',
  };
}

function bootstrap(created: McfMissionResponse): McfPhaseExecutionResponse {
  return {
    mission: {
      ...created,
      state: 'EXECUTING',
      currentPhaseId: '22222222-2222-4222-8222-222222222222',
      currentAgentId: 'Miriam',
      version: 2,
    },
    phaseId: '22222222-2222-4222-8222-222222222222',
    phaseState: 'COMPLETED',
    selectedSkill: {
      skillId: 'MCF-START-MISSION',
      name: 'Iniciar missão',
      version: '1.0.0',
      purpose: 'Definir contrato.',
      ownerAgents: ['Mestre'],
      requiredInputs: ['objective'],
      allowedTools: ['GitHub'],
      forbiddenTools: ['destructive_write'],
      permissionProfile: 'READ_AND_PROPOSE',
      executionSteps: ['definir_contrato'],
      requiredEvidence: ['mission_id'],
      acceptanceCriteria: ['objective_verifiable'],
      failureModes: ['objective_ambiguous'],
      fallback: 'Descoberta.',
      handoffTo: 'Miriam',
    },
    receipt: null,
    evidenceStatus: 'VALID',
    handoffTo: 'Miriam',
  };
}

describe('ChatRuntimeBridgeService', () => {
  it('persists the mission and executes only the internal bootstrap phase', async () => {
    const created = mission();
    const runtime = {
      createMission: vi.fn().mockResolvedValue(created),
      executePhase: vi.fn().mockResolvedValue(bootstrap(created)),
    } as unknown as MissionRuntimeService;
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner());

    const result = await service.dispatch({
      objective: 'Implementar uma ponte segura entre o chat e o runtime.',
      repository: 'leon337/multiagent-collaboration-framework',
    });

    expect(runtime.createMission).toHaveBeenCalledOnce();
    expect(runtime.executePhase).toHaveBeenCalledWith(
      created.id,
      expect.objectContaining({
        skillId: 'MCF-START-MISSION',
        agentId: 'Mestre',
        tool: expect.objectContaining({ provider: 'internal', operation: 'create-contract' }),
      }),
    );
    expect(result.bootstrapEvidenceStatus).toBe('VALID');
    expect(result.plan.filter((step) => step.state === 'READY_EXTERNAL')).toHaveLength(2);
    expect(result.humanActionRequired).toBe(false);
  });

  it('routes class C work to Léo instead of Leandro', async () => {
    const created = mission();
    const runtime = {
      createMission: vi.fn().mockResolvedValue(created),
      executePhase: vi.fn().mockResolvedValue(bootstrap(created)),
    } as unknown as MissionRuntimeService;
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner());

    const result = await service.dispatch({
      objective: 'Publicar em produção e rotacionar um segredo do serviço.',
      requestedRiskClass: 'C',
    });

    expect(result.nextAction).toMatch(/Léo/u);
    expect(result.nextAction).toMatch(/nenhuma ação técnica foi delegada a Leandro/u);
    expect(result.humanActionRequired).toBe(false);
  });
});
