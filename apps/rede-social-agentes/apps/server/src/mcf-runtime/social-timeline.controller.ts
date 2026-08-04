import { Controller, Get, Inject, Param, Req, UseGuards } from '@nestjs/common';
import type { McfSocialTimelineResponse } from '@rsa/contracts';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { SocialTimelineService } from './social-timeline.service.js';

@Controller('v1/mcf/missions/:missionId/social-candidates')
@UseGuards(SessionAuthGuard)
export class SocialTimelineController {
  constructor(@Inject(SocialTimelineService) private readonly timeline: SocialTimelineService) {}

  @Get()
  async list(
    @Param('missionId') missionId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfSocialTimelineResponse> {
    void request;
    return this.timeline.candidates(missionId);
  }
}
