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

import {
  McfLedgerMemoryWriteInvalidError,
  type McfLedgerMemoryWriteResponse,
  McfLedgerMemoryWriteUnavailableError,
  McfLedgerWriteApiService,
} from './mcf-ledger-write-api.service.js';
import { McfLedgerWriteTokenGuard } from './mcf-ledger-write-token.guard.js';

@Controller('v1/mcf/context/ledger')
@UseGuards(McfLedgerWriteTokenGuard)
export class McfLedgerWriteController {
  constructor(
    @Inject(McfLedgerWriteApiService)
    private readonly ledger: McfLedgerWriteApiService,
  ) {}

  @Post('register')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store, private')
  @Header('Pragma', 'no-cache')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  async registerExplicit(@Body() body: unknown): Promise<McfLedgerMemoryWriteResponse> {
    try {
      return await this.ledger.registerExplicit(body);
    } catch (error) {
      if (error instanceof McfLedgerMemoryWriteInvalidError) {
        throw new BadRequestException({
          code: 'MCF_LEDGER_MEMORY_WRITE_INVALID',
          message: 'The explicit memory write request is invalid.',
        });
      }
      if (error instanceof McfLedgerMemoryWriteUnavailableError) {
        throw new ServiceUnavailableException({
          code: 'MCF_LEDGER_MEMORY_WRITE_UNAVAILABLE',
          message: 'The governed memory write provider is unavailable or failed closed.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'MCF_LEDGER_MEMORY_WRITE_UNAVAILABLE',
        message: 'The governed memory write provider is unavailable or failed closed.',
      });
    }
  }
}
