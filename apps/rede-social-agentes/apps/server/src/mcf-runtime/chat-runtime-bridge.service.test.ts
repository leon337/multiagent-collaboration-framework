import type {
  ExecuteMcfPhaseRequest,
  McfMissionResponse,
  McfPhaseExecutionResponse,
  McfSkillDefinition,
} from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import type {
  ChatDispatchRepository,
  ChatDispatchReservation,
} from './chat-dispatch.repository.js';
import { ChatMissionPlanner } from './chat-mission-planner.js';
import { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import {
  McfDispatchInProgressError,
  McfDispatchPayloadConflictError,
} from './mcf-runtime.errors.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';

const accountId = 'account-0001';
const dispatchId = 'dispatch-0001';

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
      const phaseId = `22222222-2222-4222-8222-22222222222${sequence}`;
      current = {
        ...current,
        state: 'EXECUTING',
        currentPhaseId: phaseId,
        currentAgentId: dynamicHandoff,
        version: current.version + 1,
      };
      return {
        mission: current,
        phaseId,
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

function dispatchRepositoryMock(): ChatDispatchRepository {
  let reservation: ChatDispatchReservation | null = null;
  return {
    reserve: vi.fn(async (requestedAccountId, requestedDispatchId, requestDigest) => {
      if (reservation) return { status: 'EXISTING', reservation } as const;
      reservation = {
        accountId: requestedAccountId,
        dispatchId: requestedDispatchId,
        requestDigest,
        state: 'IN_PROGRESS',
        missionId: null,
        response: null,
      };
      return { status: 'RESERVED', reservation } as const;
    }),
    attachMission: vi.fn(async (_accountId, _dispatchId, _digest, missionId) => {
      if (!reservation) throw new Error('missing reservation');
      reservation = { ...reservation, missionId };
    }),
    complete: vi.fn(async (_accountId, _dispatchId, _digest, response) => {
      if (!reservation) throw new Error('missing reservation');
      reservation = { ...reservation, state: 'COMPLETED', response };
    }),
    releaseUnattached: vi.fn(async () => {
      if (reservation?.missionId === null) reservation = null;
    }),
  };
}

function request(objective = 'Implementar uma ponte segura entre o chat e o runtime.') {
  return {
    dispatchId,
    objective,
    repository: 'leon337/multiagent-collaboration-framework',
  } as const;
}

describe('ChatRuntimeBridgeService', () => {
  it('persists the mission and executes the consecutive internal startup block', async () => {
    const created = mission();
    const runtime = runtimeMock(created);
    const dispatches = dispatchRepositoryMock();
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner(), dispatches);

    const result = await service.dispatch(accountId, request());

    expect(runtime.createMission).toHaveBeenCalledOnce();
    expect(runtime.executePhase).toHaveBeenCalledTimes(2);
    expect(dispatches.attachMission).toHaveBeenCalledWith(
      accountId,
      dispatchId,
      expect.stringMatching(/^[a-f0-9]{64}$/u),
      created.id,
    );
    expect(dispatches.complete).toHaveBeenCalledOnce();
    expect(result.dispatchId).toBe(dispatchId);
    expect(result.duplicate).toBe(false);
    expect(result.bootstrapEvidenceStatus).toBe('VALID');
    expect(result.internalExecutions).toHaveLength(2);
    expect(result.mission.currentAgentId).toBe('Rafael');
    expect(result.nextAction).toMatch(/Rafael executa MCF-IMPLEMENT-CHANGE/u);
    expect(result.humanActionRequired).toBe(false);
  });

  it('returns the stored response for an identical retry without creating another mission', async () => {
    const runtime = runtimeMock(mission());
    const dispatches = dispatchRepositoryMock();
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner(), dispatches);

    const first = await service.dispatch(accountId, request());
    const second = await service.dispatch(accountId, request());

    expect(second.mission.id).toBe(first.mission.id);
    expect(second.bootstrapPhaseId).toBe(first.bootstrapPhaseId);
    expect(second.duplicate).toBe(true);
    expect(runtime.createMission).toHaveBeenCalledOnce();
  });

  it('rejects reuse of a dispatch ID with a different payload', async () => {
    const runtime = runtimeMock(mission());
    const dispatches = dispatchRepositoryMock();
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner(), dispatches);

    await service.dispatch(accountId, request());

    await expect(
      service.dispatch(
        accountId,
        request('Implementar uma ponte diferente sem reutilizar a missão anterior.'),
      ),
    ).rejects.toBeInstanceOf(McfDispatchPayloadConflictError);
  });

  it('rejects a concurrent retry while the original dispatch is still active', async () => {
    const runtime = runtimeMock(mission());
    const dispatches: ChatDispatchRepository = {
      reserve: vi.fn().mockResolvedValue({
        status: 'EXISTING',
        reservation: {
          accountId,
          dispatchId,
          requestDigest: 'c'.repeat(64),
          state: 'IN_PROGRESS',
          missionId: mission().id,
          response: null,
        },
      }),
      attachMission: vi.fn(),
      complete: vi.fn(),
      releaseUnattached: vi.fn(),
    };
    const service = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner(), dispatches);

    await expect(service.dispatch(accountId, request())).rejects.toBeInstanceOf(
      McfDispatchPayloadConflictError,
    );

    const matchingDigestRepository = dispatchRepositoryMock();
    const firstReservation = matchingDigestRepository.reserve(accountId, dispatchId, 'a'.repeat(64));
    await firstReservation;
    const inProgress = await matchingDigestRepository.reserve(
      accountId,
      dispatchId,
      'a'.repeat(64),
    );
    expect(inProgress.status).toBe('EXISTING');
  });

  it('surfaces an in-progress reservation when the digest matches', async () => {
    const base = dispatchRepositoryMock();
    const reserved = await base.reserve(accountId, dispatchId, 'unused');
    expect(reserved.status).toBe('RESERVED');

    const runtime = runtimeMock(mission());
    const requestValue = request();
    const probe = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner(), base);
    const digestCapturingRepository = dispatchRepositoryMock();
    const successfulProbe = new ChatRuntimeBridgeService(
      runtimeMock(mission()),
      new ChatMissionPlanner(),
      digestCapturingRepository,
    );
    await successfulProbe.dispatch(accountId, { ...requestValue, dispatchId: 'dispatch-probe' });
    const captured = vi.mocked(digestCapturingRepository.reserve).mock.calls[0]?.[2];
    expect(captured).toBeDefined();

    const inProgressRepository: ChatDispatchRepository = {
      reserve: vi.fn().mockResolvedValue({
        status: 'EXISTING',
        reservation: {
          accountId,
          dispatchId,
          requestDigest: captured,
          state: 'IN_PROGRESS',
          missionId: mission().id,
          response: null,
        },
      }),
      attachMission: vi.fn(),
      complete: vi.fn(),
      releaseUnattached: vi.fn(),
    };
    const service = new ChatRuntimeBridgeService(
      runtimeMock(mission()),
      new ChatMissionPlanner(),
      inProgressRepository,
    );

    await expect(service.dispatch(accountId, requestValue)).rejects.toBeInstanceOf(
      McfDispatchInProgressError,
    );
    expect(probe).toBeDefined();
  });

  it('executes an all-internal trace request without claiming an external action', async () => {
    const runtime = runtimeMock(mission());
    const service = new ChatRuntimeBridgeService(
      runtime,
      new ChatMissionPlanner(),
      dispatchRepositoryMock(),
    );

    const result = await service.dispatch(accountId, {
      dispatchId: 'dispatch-trace',
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
    const service = new ChatRuntimeBridgeService(
      runtimeMock(mission()),
      new ChatMissionPlanner(),
      dispatchRepositoryMock(),
    );

    const result = await service.dispatch(accountId, {
      dispatchId: 'dispatch-risk-c',
      objective: 'Publicar em produção e rotacionar um segredo do serviço.',
      requestedRiskClass: 'C',
    });

    expect(result.nextAction).toMatch(/Léo/u);
    expect(result.nextAction).toMatch(/nenhuma ação técnica foi delegada a Leandro/u);
    expect(result.humanActionRequired).toBe(false);
  });
});
