import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { McfCapabilityRegistrySnapshot } from '@rsa/contracts';

import {
  McfCapabilityRegistryApiService,
  McfCapabilityRegistryUnavailableError,
} from './mcf-capability-registry-api.service.js';
import { McfContextReadTokenGuard } from './mcf-context-read-token.guard.js';

const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/u;

@Controller('v1/mcf/context')
@UseGuards(McfContextReadTokenGuard)
export class McfCapabilityRegistryController {
  constructor(
    @Inject(McfCapabilityRegistryApiService)
    private readonly capabilities: McfCapabilityRegistryApiService,
  ) {}

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
