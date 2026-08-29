import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';

import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';
import {
  StagingCatalogProbeDisabledError,
  StagingCatalogProbeService,
} from './staging-catalog-probe.service.js';

@Controller('v1/mcf/staging/catalog-probe')
@UseGuards(McfMissionControlTokenGuard)
export class StagingCatalogProbeController {
  constructor(
    @Inject(StagingCatalogProbeService)
    private readonly service: StagingCatalogProbeService,
  ) {}

  @Get()
  async probe() {
    try {
      return await this.service.run();
    } catch (error) {
      if (error instanceof StagingCatalogProbeDisabledError) {
        throw new NotFoundException({
          code: 'MCF_STAGING_CATALOG_PROBE_DISABLED',
          message: 'The staging catalog probe is unavailable on this service.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'MCF_STAGING_CATALOG_PROBE_UNAVAILABLE',
        message: 'The staging catalog probe could not produce sanitized evidence.',
      });
    }
  }
}
