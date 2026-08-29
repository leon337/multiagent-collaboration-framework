import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { McfChatDispatchRequest, McfExecutableSkillId } from '@rsa/contracts';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import { MissionControlService } from './mission-control.service.js';
import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';

const executableSkill = z.enum([
  'MCF-START-MISSION',
  'MCF-SELECT-AGENTS',
  'MCF-IMPLEMENT-CHANGE',
  'MCF-REVIEW-CODE',
  'MCF-RUN-TESTS',
  'MCF-GIT-PR-RELEASE',
  'MCF-DEPLOY-VALIDATE',
  'MCF-TRACE-MISSION',
]);

const dispatchSchema = z.object({
  objective: z.string().trim().min(10).max(4_000),
  expectedOutcome: z.string().trim().min(5).max(4_000).optional(),
  repository: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u),
  requestedRiskClass: z.enum(['A', 'B', 'C']).optional(),
  requestedSkills: z.array(executableSkill).min(1).max(8).optional(),
});

const repositorySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u);

@Controller('v1/mcf/mission-control')
@UseGuards(McfMissionControlTokenGuard)
export class MissionControlController {
  constructor(@Inject(MissionControlService) private readonly service: MissionControlService) {}

  @Post('dispatch')
  @HttpCode(201)
  async dispatch(@Body() body: unknown, @Req() request: FastifyRequest) {
    const parsed = parseBody<
      Omit<McfChatDispatchRequest, 'requestedSkills'> & {
        requestedSkills?: McfExecutableSkillId[] | undefined;
      }
    >(dispatchSchema, body, request.id);
    return this.service.dispatch(parsed);
  }

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
