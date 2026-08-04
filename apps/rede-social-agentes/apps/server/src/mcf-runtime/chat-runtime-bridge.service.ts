import { Injectable } from '@nestjs/common';
import type { McfChatDispatchRequest, McfChatDispatchResponse } from '@rsa/contracts';

import { ChatMissionPlanner } from './chat-mission-planner.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

@Injectable()
export class ChatRuntimeBridgeService {
  constructor(
    private readonly runtime: MissionRuntimeService,
    private readonly planner: ChatMissionPlanner,
  ) {}

  async dispatch(request: McfChatDispatchRequest): Promise<McfChatDispatchResponse> {
    const planned = this.planner.plan(request);
    const mission = await this.runtime.createMission({ contract: planned.contract });
    const bootstrap = await this.runtime.executePhase(mission.id, {
      skillId: 'MCF-START-MISSION',
      agentId: 'Mestre',
      inputs: {
        objective: request.objective,
        scope: planned.contract.scope,
        constraints: planned.contract.outOfScope,
        source_of_truth: planned.contract.sourceOfTruth,
      },
      tool: {
        provider: 'internal',
        operation: 'create-contract',
        resource: 'mcf-chat-bridge',
      },
      expectedMissionVersion: mission.version,
    });

    const nextStep = planned.steps.find((step) => step.state === 'READY_EXTERNAL');
    const nextAction =
      planned.contract.riskClass === 'C'
        ? 'Léo deve avaliar o gate de risco antes de qualquer fase externa; nenhuma ação técnica foi delegada a Leandro.'
        : nextStep
          ? `Miriam valida o contexto persistido e passa para ${nextStep.agentId} executar ${nextStep.skillId} com recibo externo verificável.`
          : 'Miriam consolida o contexto e devolve o checkpoint ao Mestre; nenhuma ação humana é necessária.';

    return {
      mission: bootstrap.mission,
      bootstrapPhaseId: bootstrap.phaseId,
      bootstrapEvidenceStatus: bootstrap.evidenceStatus,
      plan: planned.steps,
      nextAction,
      humanActionRequired: false,
    };
  }
}
