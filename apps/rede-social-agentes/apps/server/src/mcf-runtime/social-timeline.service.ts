import { Inject, Injectable } from '@nestjs/common';
import type { McfSocialCandidateResponse, McfSocialTimelineResponse } from '@rsa/contracts';

import { McfMissionNotFoundError } from './mcf-runtime.errors.js';
import { MCF_RUNTIME_REPOSITORY, type McfRuntimeRepository } from './mcf-runtime.repository.js';

@Injectable()
export class SocialTimelineService {
  constructor(@Inject(MCF_RUNTIME_REPOSITORY) private readonly repository: McfRuntimeRepository) {}

  async candidates(missionId: string): Promise<McfSocialTimelineResponse> {
    const mission = await this.repository.findMission(missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(missionId);
    }

    const events = await this.repository.listEvents(missionId);
    const candidates: McfSocialCandidateResponse[] = events
      .filter(
        (event) => event.eventType === 'PHASE_COMPLETED' || event.eventType === 'MISSION_COMPLETED',
      )
      .map((event) => {
        const missionCompleted = event.eventType === 'MISSION_COMPLETED';
        return {
          id: `social-candidate-${event.id}`,
          missionId,
          phaseId: event.phaseId,
          kind: missionCompleted ? 'MISSION_COMPLETION' : 'PHASE_COMPLETION',
          title: missionCompleted
            ? `Missão concluída: ${mission.contract.title}`
            : `Fase concluída: ${mission.contract.title}`,
          summary: missionCompleted
            ? 'A missão atingiu os critérios de conclusão com evidência registrada no ledger do MCF.'
            : 'Uma fase da missão foi concluída e validada. O conteúdo permanece aguardando curadoria.',
          sourceEventId: event.id,
          status: 'DRAFT_REVIEW',
          createdAt: event.occurredAt.toISOString(),
        };
      });

    return {
      candidates,
      automaticPublication: false,
      humanApprovalRequired: true,
    };
  }
}
