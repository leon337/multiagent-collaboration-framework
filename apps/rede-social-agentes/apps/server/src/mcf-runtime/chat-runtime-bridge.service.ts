import { Inject, Injectable } from '@nestjs/common';
import type {
  McfChatDispatchRequest,
  McfChatDispatchResponse,
  McfChatPlanStep,
  McfExecutableSkillId,
  McfMissionContract,
} from '@rsa/contracts';

import { ChatMissionPlanner } from './chat-mission-planner.js';
import {
  buildHumanControlCheckpoint,
  isReservedHumanControlCommand,
  type HumanControlCheckpoint,
} from './human-control-policy.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

export interface McfChatDispatchAuthorityContext {
  authenticatedAccountId: string;
}

export type McfHumanControlGateResponse = HumanControlCheckpoint & {
  missionCreated: false;
  humanActionRequired: true;
};

export type McfChatRuntimeDispatchResult = McfChatDispatchResponse | McfHumanControlGateResponse;

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
      throw new Error(`skill ${skillId} is not eligible for automatic internal bridge execution`);
  }
}

@Injectable()
export class ChatRuntimeBridgeService {
  constructor(
    @Inject(MissionRuntimeService) private readonly runtime: MissionRuntimeService,
    @Inject(ChatMissionPlanner) private readonly planner: ChatMissionPlanner,
    private readonly reservedHumanAuthorityAccountId?: string,
  ) {}

  async dispatch(request: McfChatDispatchRequest): Promise<McfChatDispatchResponse>;
  async dispatch(
    request: McfChatDispatchRequest,
    authority: McfChatDispatchAuthorityContext,
  ): Promise<McfChatRuntimeDispatchResult>;
  async dispatch(
    request: McfChatDispatchRequest,
    authority?: McfChatDispatchAuthorityContext,
  ): Promise<McfChatRuntimeDispatchResult> {
    if (
      authority &&
      isReservedHumanControlCommand(
        authority.authenticatedAccountId,
        this.reservedHumanAuthorityAccountId,
        request.objective,
      )
    ) {
      return {
        ...buildHumanControlCheckpoint({
          lastCompletedAction: null,
          actionInFlight: null,
          preservedState: {
            missionCreated: false,
            phaseExecuted: false,
          },
          evidence: [
            'reserved-human-account-authenticated',
            'standalone-human-control-command-normalized',
          ],
          surface: 'chat-runtime-bridge',
          automationChannel: null,
        }),
        missionCreated: false,
        humanActionRequired: true,
      };
    }

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

    const nextStep = plan.find(
      (step) => step.state === 'READY_AGENT' || step.state === 'READY_EXTERNAL',
    );
    const nextAction =
      planned.contract.riskClass === 'C'
        ? 'Léo deve avaliar o gate de risco antes de qualquer fase posterior ao bootstrap; nenhuma ação técnica foi delegada a Leandro.'
        : nextStep?.state === 'READY_AGENT'
          ? `${nextStep.agentId} executa ${nextStep.skillId} pelo runtime interno governado, entrega execution_evidence verificável e passa o checkpoint para ${nextStep.handoffTo}.`
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
