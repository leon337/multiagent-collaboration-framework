import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import type { CreateMcfMissionRequest } from '@rsa/contracts';
import type { FastifyRequest } from 'fastify';

import { parseBody } from '../http/parse-body.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { createMissionSchema } from './mission-runtime.controller.js';
import { MissionV11ContextError, MissionV11ContextGuard } from './mission-v11-context.guard.js';

/**
 * Authenticated admission PREFLIGHT, never a mission creation or gate.
 * Relies on the exact verified PIP + alignment receipt pair already required
 * by MissionRuntimeService.createMission().
 */
@Controller('v1/mcf/mission-contracts')
@UseGuards(SessionAuthGuard)
export class MissionContractPreflightController {
  constructor(
    @Inject(MissionV11ContextGuard)
    private readonly contextGuard: MissionV11ContextGuard,
  ) {}

  @Post('preflight')
  @HttpCode(200)
  async preflight(@Body() body: unknown, @Req() request: FastifyRequest) {
    const parsed = parseBody<CreateMcfMissionRequest>(createMissionSchema, body, request.id);
    try {
      const verified = await this.contextGuard.validate(parsed.contract);
      return {
        admissionContextState: 'PASS_VERIFIED',
        contextVerified: true,
        verifiedContext: verified,
        missionCreated: false,
        executionAuthorized: false,
        humanGateApproved: false,
        nextStep: 'AUTHENTICATED_MISSION_CREATE_THROUGH_CANONICAL_RUNTIME',
      } as const;
    } catch (error) {
      if (error instanceof MissionV11ContextError) {
        throw new UnprocessableEntityException({
          code: error.code,
          message: 'Mission v1.1 context did not pass canonical admission validation.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }
}
