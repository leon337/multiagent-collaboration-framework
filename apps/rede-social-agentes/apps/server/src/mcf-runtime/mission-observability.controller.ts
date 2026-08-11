import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  McfBlockedAlertReconcileResponse,
  McfBlockedMissionListResponse,
  McfMissionObservationResponse,
} from '@rsa/contracts';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { McfMissionNotFoundError } from './mcf-runtime.errors.js';
import { MissionObservabilityService } from './mission-observability.service.js';

@Controller('v1/mcf/observability')
@UseGuards(SessionAuthGuard)
export class MissionObservabilityController {
  constructor(
    @Inject(MissionObservabilityService)
    private readonly observability: MissionObservabilityService,
  ) {}

  @Get('missions/:missionId')
  async getMission(
    @Param('missionId') missionId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfMissionObservationResponse> {
    try {
      return await this.observability.getMissionObservation(missionId);
    } catch (error) {
      if (error instanceof McfMissionNotFoundError) {
        throw new NotFoundException({
          code: 'MCF_RESOURCE_NOT_FOUND',
          message: error.message,
          correlationId: request.id,
        });
      }
      throw error;
    }
  }

  @Get('blocked')
  async listBlocked(): Promise<McfBlockedMissionListResponse> {
    return this.observability.listBlockedMissions();
  }

  @Post('blocked/reconcile')
  async reconcileBlockedAlerts(): Promise<McfBlockedAlertReconcileResponse> {
    return this.observability.reconcileBlockedAlerts();
  }
}
