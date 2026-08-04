import type {
  ExecuteMcfPhaseRequest,
  McfMissionResponse,
  McfPhaseExecutionResponse,
  McfSkillDefinition,
} from '@rsa/contracts';
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
      selectedAgents: [
        'Mestre',
        'Miriam',
        'Rafael',
        'Vinicius',
        'Renato',
        'Emily',
        'Gabriel',
        'Augusto',
        'Beatriz',
      ],
      selectedSkills: [
        'MCF-START-MISSION',
        'MCF-SELECT-AGENTS',
        'MCF-IMPLEMENT-CHANGE',
        'MCF-REVIEW-CODE',
        'MCF-RUN-TESTS',
        'MCF-GIT-PR-RELEASE',
        'MCF-TRACE-MISSION',
      ],
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

function skill(skillId: string, handoffTo: string): McfSkillDefinition {
  return {
    skillId,
    name: skillId,
    version: '1.0.0',
    purpose: 'Testar bridge.',
    ownerAgents: ['Mestre'],
    requiredInputs: ['objective'],
    allowedTools: ['GitHub'],
    forbiddenTools: ['destructive_write'],
    permissionProfile: 'READ_AND_PROPOSE',
    executionSteps: ['execute'],
    requiredEvidence: ['phase_id'],
    acceptanceCriteria: ['valid'],
    failureModes: ['invalid'],
    fallback: 'Registrar bloqueio.',
    handoffTo,
  };
}

function runtimeMock(created: McfMissionResponse): MissionRuntimeService {
  let current = created;
  let sequence = 0;
  const executePhase = vi.fn(
    async (
      _missionId: string,
      input: ExecuteMcfPhaseRequest,
    ): Promise<McfPhaseExecutionResponse> => {
      sequence += 1;
      expect(input.expectedMissionVersion).toBe(current.version);
      const dynamicHandoff =
        input.skillId === 'MCF-SELECT-AGENTS'
          ? String(input.inputs.selected_domain_agent)
          : 'Miriam';
      current = {
        ...current,
        state: 'EXECUTING',
        currentPhaseId: `22222222-2222-4222-8222-22222222222${sequence}`,
        currentAgentId: dynamicHandoff,
        version: current.version + 1,
      };
      return {
        mission: current,
        phaseId: current.currentPhaseId,
        phaseState: 'COMPLETED',
        selectedSkill: skill(input.skillId, dynamicHandoff),
        receipt: null,
        evidenceStatus: 'VALID',
        handoffTo: dynamicHandoff,
      };
    },
  );

  return {
    createMission: vi.fn().mockResolvedValue(created),
    executePhase,
  } as unknown as MissionRuntimeService;
}

describe('ChatRuntimeBridgeService', () => {
  it('persists the mission and executes the consecutive internal startup block', async () => {
    const created = mission();
    const runtime = runtimeMock(created);
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner());

    const result = await service.dispatch({
      objective: 'Implementar uma ponte segura entre o chat e o runtime.',
      repository: 'leon337/multiagent-collaboration-framework',
    });

    expect(runtime.createMission).toHaveBeenCalledOnce();
    expect(runtime.executePhase).toHaveBeenCalledTimes(2);
    expect(runtime.executePhase).toHaveBeenNthCalledWith(
      1,
      created.id,
      expect.objectContaining({
        skillId: 'MCF-START-MISSION',
        agentId: 'Mestre',
        tool: expect.objectContaining({ provider: 'internal', operation: 'create-contract' }),
      }),
    );
    expect(runtime.executePhase).toHaveBeenNthCalledWith(
      2,
      created.id,
      expect.objectContaining({
        skillId: 'MCF-SELECT-AGENTS',
        inputs: expect.objectContaining({ selected_domain_agent: 'Rafael' }),
        tool: expect.objectContaining({ provider: 'internal', operation: 'inspect-selection' }),
      }),
    );
    expect(result.bootstrapEvidenceStatus).toBe('VALID');
    expect(result.internalExecutions).toHaveLength(2);
    expect(result.internalExecutions[1]).toMatchObject({
      skillId: 'MCF-SELECT-AGENTS',
      handoffTo: 'Rafael',
    });
    expect(result.mission.currentAgentId).toBe('Rafael');
    expect(result.plan.filter((step) => step.state === 'READY_EXTERNAL')).toHaveLength(4);
    expect(result.plan.at(-1)?.state).toBe('PLANNED_INTERNAL');
    expect(result.nextAction).toMatch(/Rafael executa MCF-IMPLEMENT-CHANGE/u);
    expect(result.humanActionRequired).toBe(false);
  });

  it('executes an all-internal trace request without claiming an external action', async () => {
    const created = mission();
    const runtime = runtimeMock(created);
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner());

    const result = await service.dispatch({
      objective: 'Verificar o fluxo interno e produzir o trace da missão.',
      requestedSkills: ['MCF-TRACE-MISSION'],
    });

    expect(runtime.executePhase).toHaveBeenCalledTimes(3);
    expect(result.internalExecutions.map((execution) => execution.skillId)).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-TRACE-MISSION',
    ]);
    expect(result.plan.every((step) => step.state === 'COMPLETED')).toBe(true);
    expect(result.nextAction).toMatch(/checkpoint retorna ao Mestre/u);
  });

  it('routes class C work to Léo instead of Leandro', async () => {
    const created = mission();
    const runtime = runtimeMock(created);
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
