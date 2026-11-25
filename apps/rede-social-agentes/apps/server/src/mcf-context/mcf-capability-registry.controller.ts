import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Inject,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type {
  McfCapabilityGapReport,
  McfCapabilityRegistrySnapshot,
  McfProjectBootstrapPlan,
} from '@rsa/contracts';

import {
  McfCapabilityRegistryApiService,
  McfCapabilityRegistryUnavailableError,
} from './mcf-capability-registry-api.service.js';
import { McfContextReadTokenGuard } from './mcf-context-read-token.guard.js';
import {
  parseMcfCapabilityGapRequest,
  parseMcfProjectBootstrapRequest,
} from './mcf-capability-gap.validation.js';

const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/u;

@Controller('v1/mcf/context')
@UseGuards(McfContextReadTokenGuard)
export class McfCapabilityRegistryController {
  constructor(
    @Inject(McfCapabilityRegistryApiService)
    private readonly capabilities: McfCapabilityRegistryApiService,
  ) {}

  @Post('capability-gaps')
  analyzeGaps(@Body() body: unknown): McfCapabilityGapReport {
    try {
      return this.capabilities.analyzeGaps(parseMcfCapabilityGapRequest(body));
    } catch (error) {
      if (error instanceof Error && error.message === 'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID') {
        throw new BadRequestException({
          code: 'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID',
          message: 'Capability gap request must match the strict read-only analysis contract.',
        });
      }
      if (error instanceof McfCapabilityRegistryUnavailableError) {
        throw new ServiceUnavailableException({
          code: 'MCF_CAPABILITY_REGISTRY_UNAVAILABLE',
          message: error.message,
        });
      }
      throw error;
    }
  }

  @Post('project-bootstrap-plan')
  buildBootstrapPlan(@Body() body: unknown): McfProjectBootstrapPlan {
    try {
      return this.capabilities.buildBootstrapPlan(parseMcfProjectBootstrapRequest(body));
    } catch (error) {
      if (error instanceof Error && error.message === 'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID') {
        throw new BadRequestException({
          code: 'MCF_PROJECT_BOOTSTRAP_INPUT_INVALID',
          message: 'Project bootstrap request must match the strict plan-only contract.',
        });
      }
      if (error instanceof McfCapabilityRegistryUnavailableError) {
        throw new ServiceUnavailableException({
          code: 'MCF_CAPABILITY_REGISTRY_UNAVAILABLE',
          message: error.message,
        });
      }
      throw error;
    }
  }

  @Get('capabilities')
  listReadOnly(@Query('project_id') projectId: string | undefined): McfCapabilityRegistrySnapshot {
    if (
      projectId !== undefined &&
      (projectId.length === 0 ||
        projectId.length > 128 ||
        projectId !== projectId.trim() ||
        !PROJECT_ID_PATTERN.test(projectId))
    ) {
      throw new BadRequestException({
        code: 'MCF_CAPABILITY_QUERY_INVALID',
        message: 'project_id must be a stable lowercase project identifier.',
      });
    }

    try {
      return this.capabilities.listReadOnly(projectId);
    } catch (error) {
      if (error instanceof McfCapabilityRegistryUnavailableError) {
        throw new ServiceUnavailableException({
          code: 'MCF_CAPABILITY_REGISTRY_UNAVAILABLE',
          message: error.message,
        });
      }
      throw error;
    }
  }
}
