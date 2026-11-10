import {
  BadGatewayException,
  BadRequestException,
  Controller,
  GatewayTimeoutException,
  Get,
  Header,
  Inject,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';

import { McfContextReadTokenGuard } from './mcf-context-read-token.guard.js';
import {
  McfAppHubInventoryReadService,
  McfAppHubInventoryUnavailableError,
  type McfAppHubInventoryReceipt,
} from './mcf-apphub-inventory-read.service.js';

@Controller('v1/mcf/context')
@UseGuards(McfContextReadTokenGuard)
export class McfAppHubInventoryReadController {
  constructor(
    @Inject(McfAppHubInventoryReadService)
    private readonly inventory: McfAppHubInventoryReadService,
  ) {}

  @Get('cloud/apphub')
  @Header('Cache-Control', 'private, no-store')
  async readOnly(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<McfAppHubInventoryReceipt> {
    if (Object.keys(query).length !== 0) {
      throw new BadRequestException({
        code: 'MCF_APPHUB_QUERY_INVALID',
        message: 'This endpoint does not accept query parameters.',
      });
    }
    try {
      return await this.inventory.readOnly();
    } catch (error) {
      if (error instanceof McfAppHubInventoryUnavailableError) {
        const response = {
          code: error.code,
          message: 'The App Hub inventory read is unavailable.',
        };
        if (error.code === 'MCF_APPHUB_READ_DISABLED' || error.code === 'MCF_APPHUB_BUSY') {
          throw new ServiceUnavailableException(response);
        }
        if (error.code === 'MCF_APPHUB_TIMEOUT') throw new GatewayTimeoutException(response);
        throw new BadGatewayException(response);
      }
      throw new BadGatewayException({
        code: 'MCF_APPHUB_UPSTREAM_FAILED',
        message: 'The App Hub inventory read is unavailable.',
      });
    }
  }
}
