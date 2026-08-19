import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import {
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import {
  ProductionAuthorizationService,
  type ProductionAuthorizationResolution,
  type RecordLeoOperationalGateRequest,
  type ResolveProductionAuthorizationRequest,
} from './production-authorization.service.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';

const exactSha = z.string().regex(/^[a-f0-9]{40}$/u);

const operationalGateSchema = z
  .object({
    missionId: z.string().uuid(),
    phaseId: z.string().uuid(),
    releaseSha: exactSha,
    decision: z.enum(['APPROVE', 'REJECT']),
    sourceRef: z.string().trim().min(1).max(512),
    evidenceRef: z.string().trim().min(1).max(512),
  })
  .strict();

const resolveSchema = z
  .object({
    missionId: z.string().uuid(),
    phaseId: z.string().uuid(),
    releaseSha: exactSha,
  })
  .strict();

function rethrowProductionAuthorizationError(error: unknown, correlationId: string): never {
  if (error instanceof McfMissionNotFoundError || error instanceof McfPhaseNotFoundError) {
    throw new NotFoundException({
      code: 'MCF_RESOURCE_NOT_FOUND',
      message: error.message,
      correlationId,
    });
  }
  if (error instanceof McfPermissionDeniedError) {
    throw new ForbiddenException({
      code: 'MCF_PERMISSION_DENIED',
      message: error.message,
      correlationId,
    });
  }
  throw error;
}

@Controller('v1/mcf/production-authorization')
@UseGuards(McfRuntimeTokenGuard)
export class ProductionAuthorizationController {
  constructor(
    @Inject(ProductionAuthorizationService)
    private readonly productionAuthorization: ProductionAuthorizationService,
  ) {}

  @Post('operational-gate')
  @HttpCode(202)
  async recordOperationalGate(
    @Body() body: unknown,
    @Req() request: { id: string },
  ): Promise<{
    accepted: true;
    duplicate: boolean;
    operationalGate: 'LEO';
    targetSha: string;
  }> {
    const input = parseBody<RecordLeoOperationalGateRequest>(operationalGateSchema, body, request.id);
    try {
      return await this.productionAuthorization.recordLeoOperationalGate(input);
    } catch (error) {
      rethrowProductionAuthorizationError(error, request.id);
    }
  }

  @Post('resolve')
  @HttpCode(200)
  async resolve(
    @Body() body: unknown,
    @Req() request: { id: string },
  ): Promise<ProductionAuthorizationResolution> {
    const input = parseBody<ResolveProductionAuthorizationRequest>(resolveSchema, body, request.id);
    try {
      return await this.productionAuthorization.resolveProductionAuthorization(input);
    } catch (error) {
      rethrowProductionAuthorizationError(error, request.id);
    }
  }
}
