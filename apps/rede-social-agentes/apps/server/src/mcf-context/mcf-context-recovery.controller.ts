import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { McfContextRecoveryReceipt } from '@rsa/contracts';

import { McfContextReadTokenGuard } from './mcf-context-read-token.guard.js';
import {
  McfContextRecoveryApiService,
  McfContextRecoveryUnavailableError,
} from './mcf-context-recovery-api.service.js';

function parseCurrentStateQuery(value: string | undefined): boolean {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;
  throw new BadRequestException({
    code: 'MCF_CONTEXT_QUERY_INVALID',
    message: 'requires_current_operational_state must be true or false.',
  });
}

@Controller('v1/mcf/context')
@UseGuards(McfContextReadTokenGuard)
export class McfContextRecoveryController {
  constructor(
    @Inject(McfContextRecoveryApiService)
    private readonly recovery: McfContextRecoveryApiService,
  ) {}

  @Get('recovery')
  async recoverReadOnly(
    @Query('project_hint') projectHint: string | undefined,
    @Query('requires_current_operational_state') requiresCurrentState: string | undefined,
  ): Promise<McfContextRecoveryReceipt> {
    if (
      projectHint === undefined ||
      projectHint.length === 0 ||
      projectHint.length > 1024 ||
      projectHint !== projectHint.trim()
    ) {
      throw new BadRequestException({
        code: 'MCF_CONTEXT_QUERY_INVALID',
        message: 'project_hint must be a non-empty bounded string without outer whitespace.',
      });
    }

    try {
      return await this.recovery.recoverReadOnly(
        projectHint,
        parseCurrentStateQuery(requiresCurrentState),
      );
    } catch (error) {
      if (error instanceof McfContextRecoveryUnavailableError) {
        throw new ServiceUnavailableException({
          code: 'MCF_CONTEXT_RECOVERY_UNAVAILABLE',
          message: error.message,
        });
      }
      throw error;
    }
  }
}
