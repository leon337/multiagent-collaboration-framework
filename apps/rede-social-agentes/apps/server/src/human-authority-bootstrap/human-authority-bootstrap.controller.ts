import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import {
  BootstrapSessionAuthGuard,
  type BootstrapAuthenticatedRequest,
} from './bootstrap-session-auth.guard.js';
import {
  HumanAuthorityBootstrapConflictError,
  HumanAuthorityBootstrapService,
} from './human-authority-bootstrap.service.js';

const createIntentSchema = z
  .object({
    action: z.literal('BIND_CURRENT_AUTHENTICATED_ACCOUNT'),
    target: z.literal('STAGING'),
  })
  .strict();

@Controller('v1/bootstrap/human-authority')
@UseGuards(BootstrapSessionAuthGuard)
export class HumanAuthorityBootstrapController {
  constructor(
    @Inject(HumanAuthorityBootstrapService)
    private readonly service: HumanAuthorityBootstrapService,
  ) {}

  @Post('intents')
  @HttpCode(201)
  async createIntent(@Body() body: unknown, @Req() request: BootstrapAuthenticatedRequest) {
    const parsed = parseBody(createIntentSchema, body, request.id);
    try {
      return await this.service.createIntent(request.authenticatedHuman, parsed);
    } catch (error) {
      if (error instanceof HumanAuthorityBootstrapConflictError) {
        throw new ConflictException({
          code: 'HUMAN_AUTHORITY_BINDING_CONFLICT',
          message: error.message,
          correlationId: request.id,
        });
      }
      throw error;
    }
  }
}
