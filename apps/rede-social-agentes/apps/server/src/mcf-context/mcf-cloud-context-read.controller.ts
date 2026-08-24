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
import type { McfCloudContextReadReceipt } from '@rsa/contracts';

import { McfCloudContextIngressTokenGuard } from './mcf-cloud-context-ingress-token.guard.js';
import {
  McfCloudContextReadService,
  McfCloudContextReadUnavailableError,
} from './mcf-cloud-context-read.service.js';

@Controller('v1/mcf/context')
@UseGuards(McfCloudContextIngressTokenGuard)
export class McfCloudContextReadController {
  constructor(
    @Inject(McfCloudContextReadService)
    private readonly cloudContext: McfCloudContextReadService,
  ) {}

  @Get('cloud/g2a')
  @Header('Cache-Control', 'private, no-store')
  async readOnly(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<McfCloudContextReadReceipt> {
    if (Object.keys(query).length !== 0) {
      throw new BadRequestException({
        code: 'MCF_CLOUD_CONTEXT_QUERY_INVALID',
        message: 'The local Cloud context read does not accept query parameters.',
      });
    }

    try {
      return await this.cloudContext.readOnly();
    } catch (error) {
      if (error instanceof McfCloudContextReadUnavailableError) {
        const response = {
          code: error.code,
          message: 'The local read-only Cloud context adapter is unavailable.',
        };
        if (
          error.code === 'MCF_CLOUD_CONTEXT_READ_DISABLED' ||
          error.code === 'MCF_CLOUD_CONTEXT_BUSY'
        ) {
          throw new ServiceUnavailableException(response);
        }
        if (error.code === 'MCF_CLOUD_CONTEXT_TIMEOUT') {
          throw new GatewayTimeoutException(response);
        }
        throw new BadGatewayException(response);
      }
      throw new BadGatewayException({
        code: 'MCF_CLOUD_CONTEXT_ADAPTER_FAILED',
        message: 'The local read-only Cloud context adapter is unavailable.',
      });
    }
  }
}
