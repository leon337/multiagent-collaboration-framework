import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import type { McfCiCallbackResponse } from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import {
  McfEvidenceRejectedError,
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';
import {
  type McfStagingDeployCallbackRequest,
  StagingDeployReconciliationService,
} from './staging-deploy-reconciliation.service.js';

const stagingDeployCallbackSchema = z.object({
  missionId: z.string().uuid(),
  phaseId: z.string().uuid(),
  requestId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u),
  releaseSha: z.string().regex(/^[a-f0-9]{40}$/u),
  workflowRunId: z.string().regex(/^[1-9][0-9]*$/u),
  repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u),
  completedAt: z.string().datetime({ offset: true }),
  stagingRuntimeUrl: z.string().url().max(2048),
});

@Controller('v1/mcf/callbacks')
@UseGuards(McfRuntimeTokenGuard)
export class McfStagingDeployCallbackController {
  constructor(
    @Inject(StagingDeployReconciliationService)
    private readonly reconciliation: StagingDeployReconciliationService,
  ) {}

  @Post('staging-deploy')
  @HttpCode(202)
  async accept(
    @Body() body: unknown,
    @Req() request: { id: string },
  ): Promise<McfCiCallbackResponse> {
    const input = parseBody<McfStagingDeployCallbackRequest>(
      stagingDeployCallbackSchema,
      body,
      request.id,
    );
    try {
      return await this.reconciliation.accept(input);
    } catch (error) {
      if (error instanceof McfMissionNotFoundError || error instanceof McfPhaseNotFoundError) {
        throw new NotFoundException({ code: 'MCF_RESOURCE_NOT_FOUND', message: error.message });
      }
      if (error instanceof McfPermissionDeniedError) {
        throw new ForbiddenException({ code: 'MCF_PERMISSION_DENIED', message: error.message });
      }
      if (error instanceof McfEvidenceRejectedError) {
        throw new UnprocessableEntityException({
          code: 'MCF_STAGING_RECONCILIATION_PENDING',
          message: error.message,
        });
      }
      throw error;
    }
  }
}
