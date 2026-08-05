import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  McfChatDispatchRequest,
  McfChatDispatchResponse,
  McfChatPlanStep,
  McfExecutableSkillId,
  McfMissionContract,
} from '@rsa/contracts';

import {
  CHAT_DISPATCH_REPOSITORY,
  type ChatDispatchRepository,
} from './chat-dispatch.repository.js';
import { ChatMissionPlanner } from './chat-mission-planner.js';
import {
  McfDispatchInProgressError,
  McfDispatchPayloadConflictError,
} from './mcf-runtime.errors.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

function selectedDomainAgent(plan: McfChatPlanStep[], currentOrder: number): string {
  return (
    plan.find((step) => step.order > currentOrder && step.skillId !== 'MCF-TRACE-MISSION')
      ?.agentId ??
    plan.find((step) => step.order > currentOrder)?.agentId ??
    'Mestre'
  );
}

function requestDigest(request: McfChatDispatchRequest): string {
  const canonical = JSON.stringify({
    objective: request.objective,
    expectedOutcome: request.expectedOutcome ?? null,
    repository: request.repository ?? null,
    sourceOfTruth: request.sourceOfTruth ?? [],
    requestedRiskClass: request.requestedRiskClass ?? null,
    requestedSkills: request.requestedSkills ?? [],
  });
  return createHash('sha256').update(canonical).digest('hex');
}

function internalInputs(
  skillId: McfExecutableSkillId,
  step: McfChatPlanStep,
  request: McfChatDispatchRequest,
  contract: McfMissionContract,
  plan: McfChatPlanStep[],
  missionId: string,
): Record<string, unknown> {
  switch (skillId) {
    case 'MCF-START-MISSION':
      return {
        objective: request.objective,
        scope: contract.scope,
        constraints: contract.outOfScope,
        source_of_truth: contract.sourceOfTruth,
      };
    case 'MCF-SELECT-AGENTS':
      return {
        mission_contract: contract,
        risk_class: contract.riskClass,
        selected_domain_agent: selectedDomainAgent(plan, step.order),
      };
    case 'MCF-TRACE-MISSION':
      return {
        final_checkpoint: true,
        mission_execution: {
          missionId,
          objective: contract.objective,
          plannedSteps: plan.map((plannedStep) => ({
            order: plannedStep.order,
            skillId: plannedStep.skillId,
            agentId: plannedStep.agentId,
            handoffTo: plannedStep.handoffTo,
            state: plannedStep.state,
          })),
        },
      };
    default:
      throw new Error(`skill ${skillId} is not eligible for internal bridge execution`);
  }
}

@Injectable()
export class ChatRuntimeBridgeService {
  constructor(
    @Inject(MissionRuntimeService) private readonly runtime: MissionRuntimeService,
    @Inject(ChatMissionPlanner) private readonly planner: ChatMissionPlanner,
    @Inject(CHAT_DISPATCH_REPOSITORY)
    private readonly dispatches: ChatDispatchRepository,
  ) {}

  async dispatch(
    accountId: string,
    request: McfChatDispatchRequest,
  ): Promise<McfChatDispatchResponse> {
    const planned = this.planner.plan(request);
    const digest = requestDigest(request);
    const reservation = await this.dispatches.reserve(accountId, request.dispatchId, digest);

    if (reservation.status === 'EXISTING') {
      if (reservation.reservation.requestDigest !== digest) {
        throw new McfDispatchPayloadConflictError(request.dispatchId);
      }
      if (reservation.reservation.state !== 'COMPLETED' || !reservation.reservation.response) {
        throw new McfDispatchInProgressError(request.dispatchId);
      }
      return { ...reservation.reservation.response, duplicate: true };
    }

    let missionAttached = false;
    try {
      const plan = planned.steps.map((step) => ({ ...step }));
      let currentMission = await this.runtime.createMission({ contract: planned.contract });
      await this.dispatches.attachMission(
        accountId,
        request.dispatchId,
        digest,
        currentMission.id,
      );
      missionAttached = true;
      const internalExecutions: McfChatDispatchResponse['internalExecutions'] = [];

      for (const step of plan) {
        if (step.state !== 'PLANNED_INTERNAL') break;

        const result = await this.runtime.executePhase(currentMission.id, {
          skillId: step.skillId,
          agentId: step.agentId,
          inputs: internalInputs(
            step.skillId,
            step,
            request,
            planned.contract,
            plan,
            currentMission.id,
          ),
          tool: {
            provider: step.toolProvider,
            operation: step.toolOperation,
            resource: step.toolResource,
          },
          expectedMissionVersion: currentMission.version,
        });

        currentMission = result.mission;
        step.state = 'COMPLETED';
        internalExecutions.push({
          skillId: step.skillId,
          phaseId: result.phaseId,
          evidenceStatus: result.evidenceStatus,
          handoffTo: result.handoffTo,
        });
      }

      const bootstrap = internalExecutions[0];
      if (!bootstrap || bootstrap.skillId !== 'MCF-START-MISSION') {
        throw new Error('chat bridge did not execute the mandatory mission bootstrap');
      }

      const nextStep = plan.find((step) => step.state === 'READY_EXTERNAL');
      const nextAction =
        planned.contract.riskClass === 'C'
          ? 'Léo deve avaliar o gate de risco antes de qualquer fase externa; nenhuma ação técnica foi delegada a Leandro.'
          : nextStep
            ? `${nextStep.agentId} executa ${nextStep.skillId} com a ferramenta indicada e entrega recibo externo verificável para ${nextStep.handoffTo}.`
            : 'O bloco interno foi concluído e o checkpoint retorna ao Mestre; nenhuma ação humana é necessária.';

      const response: McfChatDispatchResponse = {
        dispatchId: request.dispatchId,
        duplicate: false,
        mission: currentMission,
        bootstrapPhaseId: bootstrap.phaseId,
        bootstrapEvidenceStatus: bootstrap.evidenceStatus,
        internalExecutions,
        plan,
        nextAction,
        humanActionRequired: false,
      };
      await this.dispatches.complete(accountId, request.dispatchId, digest, response);
      return response;
    } catch (error) {
      if (!missionAttached) {
        await this.dispatches.releaseUnattached(accountId, request.dispatchId, digest);
      }
      throw error;
    }
  }
}
