import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type {
  AnonymizeAccountRequest,
  AnonymizeAccountResponse,
  PrivacyExportResponse,
} from '@rsa/contracts/privacy';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  InvalidPrivacyCredentialsError,
  PrivacyAccountUnavailableError,
  PrivacyAnonymizationBlockedError,
} from './privacy.errors.js';
import { PrivacyService } from './privacy.service.js';

const anonymizeSchema = z.object({
  password: z.string().min(1).max(128),
});

@Controller('v1/privacy')
@UseGuards(SessionAuthGuard)
export class PrivacyController {
  constructor(@Inject(PrivacyService) private readonly privacy: PrivacyService) {}

  @Get('export')
  async exportAccountData(
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<PrivacyExportResponse> {
    try {
      return await this.privacy.exportAccountData(
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      if (error instanceof PrivacyAccountUnavailableError) {
        throw new ConflictException({
          code: 'PRIVACY_ACCOUNT_UNAVAILABLE',
          message: 'The account is not available for this privacy operation.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }

  @Post('anonymize')
  @HttpCode(200)
  async anonymizeAccount(
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<AnonymizeAccountResponse> {
    const input = parseBody<AnonymizeAccountRequest>(anonymizeSchema, body, request.id);
    try {
      return await this.privacy.anonymizeAccount(
        request.authenticatedHuman.accountId,
        input.password,
        request.id,
      );
    } catch (error) {
      if (
        error instanceof InvalidPrivacyCredentialsError ||
        error instanceof PrivacyAccountUnavailableError
      ) {
        throw new UnauthorizedException({
          code: 'PRIVACY_CREDENTIALS_INVALID',
          message: 'The privacy operation could not be authenticated.',
          correlationId: request.id,
        });
      }
      if (error instanceof PrivacyAnonymizationBlockedError) {
        throw new ConflictException({
          code: 'ACCOUNT_ANONYMIZATION_BLOCKED',
          message: 'Active operational dependencies must be resolved before anonymization.',
          correlationId: request.id,
          details: { blockers: error.blockers },
        });
      }
      throw error;
    }
  }
}
