import {
  BadRequestException,
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';

import { McfContextReadTokenGuard } from './mcf-context-read-token.guard.js';
import {
  McfLedgerQueryInvalidError,
  McfLedgerReadApiService,
  type McfLedgerReadResponse,
  McfLedgerReadUnavailableError,
} from './mcf-ledger-read-api.service.js';

@Controller('v1/mcf/context/ledger')
@UseGuards(McfContextReadTokenGuard)
export class McfLedgerReadController {
  constructor(
    @Inject(McfLedgerReadApiService)
    private readonly ledger: McfLedgerReadApiService,
  ) {}

  @Post('query')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store, private')
  @Header('Pragma', 'no-cache')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async queryReadOnly(@Body() body: unknown): Promise<McfLedgerReadResponse> {
    try {
      return await this.ledger.queryReadOnly(body);
    } catch (error) {
      if (error instanceof McfLedgerQueryInvalidError) {
        throw new BadRequestException({
          code: 'MCF_LEDGER_QUERY_INVALID',
          message: 'The Cognitive Ledger read query is invalid or exceeds its input limit.',
        });
      }
      if (error instanceof McfLedgerReadUnavailableError) {
        throw new ServiceUnavailableException({
          code: 'MCF_LEDGER_READ_UNAVAILABLE',
          message: 'The Cognitive Ledger read-only provider is unavailable or failed closed.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'MCF_LEDGER_READ_UNAVAILABLE',
        message: 'The Cognitive Ledger read-only provider is unavailable or failed closed.',
      });
    }
  }
}
