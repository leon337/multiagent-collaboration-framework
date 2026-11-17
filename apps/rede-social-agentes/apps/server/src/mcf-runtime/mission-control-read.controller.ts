import { Controller, Get, Inject, NotFoundException, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import { MissionControlService } from './mission-control.service.js';
import { McfMissionControlReadTokenGuard } from './mission-control-read-token.guard.js';

// The Pet's read credential is bound to this single canonical repository.
const repositorySchema = z.literal('leon337/multiagent-collaboration-framework');

/**
 * Fixed, read-only surface for the MCF Service Hub / Pet observer.
 *
 * Does not accept a request body, mission dispatch, operation selectors,
 * arbitrary URLs or caller-supplied authentication grants.
 */
@Controller('v1/mcf/mission-control/read')
@UseGuards(McfMissionControlReadTokenGuard)
export class MissionControlReadController {
  constructor(@Inject(MissionControlService) private readonly service: MissionControlService) {}

  @Get('latest')
  async latest(
    @Query('repository') repository: string | undefined,
    @Req() request: FastifyRequest,
  ) {
    const parsed = repositorySchema.safeParse(repository);
    if (!parsed.success) {
      throw new NotFoundException({
        code: 'MCF_MISSION_CONTROL_REPOSITORY_INVALID',
        message: 'A canonical owner/repository query is required.',
        correlationId: request.id,
      });
    }
    const snapshot = await this.service.latest(parsed.data);
    if (!snapshot) {
      throw new NotFoundException({
        code: 'MCF_MISSION_CONTROL_EMPTY',
        message: 'No Mission Control mission exists for this repository.',
        correlationId: request.id,
      });
    }
    return snapshot;
  }
}
