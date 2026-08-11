import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type {
  McfBlockedAlertReconcileResponse,
  McfBlockedMissionListResponse,
  McfMissionObservationResponse,
} from '@rsa/contracts';

import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import type { MissionObservabilityService } from './mission-observability.service.js';

@Controller('mcf/observability')
@UseGuards(SessionAuthGuard)
export class MissionObservabilityController {
  constructor(private readonly observability: MissionObservabilityService) {}

  @Get('missions/:missionId')
  async getMission(@Param('missionId') missionId: string): Promise<McfMissionObservationResponse> {
    return this.observability.getMissionObservation(missionId);
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
