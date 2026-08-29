import { Inject, Injectable } from '@nestjs/common';
import type {
  McfChatDispatchRequest,
  McfChatDispatchResponse,
  McfMissionObservationResponse,
  McfMissionTimelineResponse,
} from '@rsa/contracts';

import { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import { MissionControlRepository } from './mission-control.repository.js';
import { MissionObservabilityService } from './mission-observability.service.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

const CHANNEL_PREFIX = 'mission-control-repository:';

function repositoryReference(repository: string): string {
  return `${CHANNEL_PREFIX}${repository.trim().toLowerCase()}`;
}

export interface McfMissionControlSnapshot {
  source: 'MCF_MISSION_CONTROL_READ_ONLY';
  repository: string;
  mission: McfMissionTimelineResponse['mission'];
  timeline: McfMissionTimelineResponse;
  observability: McfMissionObservationResponse;
}

@Injectable()
export class MissionControlService {
  constructor(
    @Inject(ChatRuntimeBridgeService) private readonly bridge: ChatRuntimeBridgeService,
    @Inject(MissionRuntimeService) private readonly runtime: MissionRuntimeService,
    @Inject(MissionObservabilityService)
    private readonly observability: MissionObservabilityService,
    @Inject(MissionControlRepository) private readonly repository: MissionControlRepository,
  ) {}

  async dispatch(request: McfChatDispatchRequest): Promise<McfChatDispatchResponse> {
    const repository = request.repository?.trim();
    if (!repository) throw new Error('Mission Control dispatch requires a repository');
    const sourceOfTruth = [
      ...(request.sourceOfTruth ?? []),
      'chat-surface:chatgpt-gpt-action',
      repositoryReference(repository),
    ];
    return this.bridge.dispatch({
      ...request,
      repository,
      sourceOfTruth: [...new Set(sourceOfTruth)],
    });
  }

  async latest(repository: string): Promise<McfMissionControlSnapshot | null> {
    const normalized = repository.trim().toLowerCase();
    const missionId = await this.repository.findLatestMissionId(repositoryReference(normalized));
    if (!missionId) return null;
    const [timeline, observability] = await Promise.all([
      this.runtime.timeline(missionId),
      this.observability.getMissionObservation(missionId),
    ]);
    return {
      source: 'MCF_MISSION_CONTROL_READ_ONLY',
      repository: normalized,
      mission: timeline.mission,
      timeline,
      observability,
    };
  }
}
