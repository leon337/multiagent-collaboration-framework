import { Inject, Injectable } from '@nestjs/common';
import type {
  McfChatDispatchRequest,
  McfChatDispatchResponse,
  McfChatPlanStep,
  McfExecutableSkillId,
  McfMissionContract,
} from '@rsa/contracts';

import { ChatMissionPlanner } from './chat-mission-planner.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

function selectedDomainAgent(plan: McfChatPlanStep[], currentOrder: number): string {
  return (
    plan.find((step) => step.order > currentOrder && step.skillId !== 'MCF-TRACE-MISSION')
      ?.agentId ??
    plan.find((step) => step.order > currentOrder)?.agentId ??
    'Mestre'
  );
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
  ) {}

  async dispatch(request: McfChatDispatchRequest): Promise<McfChatDispatchResponse> {
    const planned = this.planner.plan(request);
    const plan = planned.steps.map((step) => ({ ...step }));
    let currentMission = await this.runtime.createMission({ contract: planned.contract });
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

    return {
      mission: currentMission,
      bootstrapPhaseId: bootstrap.phaseId,
      bootstrapEvidenceStatus: bootstrap.evidenceStatus,
      internalExecutions,
      plan,
      nextAction,
      humanActionRequired: false,
    };
  }
}
