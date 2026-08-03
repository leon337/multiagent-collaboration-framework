import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ModerationCaseListResponse,
  ModerationCaseResponse,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  InvalidModerationCursorError,
  ModerationCaseNotAvailableError,
  ModerationOperatorAccessDeniedError,
  ModerationStateConflictError,
  ModerationTargetNotAvailableError,
} from './moderation.errors.js';
import { ModerationService } from './moderation.service.js';

const createReportSchema = z.object({
  targetType: z.enum(['CONTENT', 'COMMENT', 'AGENT', 'COMMUNITY']),
  targetId: z.string().trim().min(1).max(128),
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'IMPERSONATION',
    'PRIVACY',
    'SECURITY',
    'ILLEGAL_CONTENT',
    'OTHER',
  ]),
  details: z.string().trim().max(4000).optional(),
});

const queueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(1024).optional(),
});

@Controller('v1')
@UseGuards(SessionAuthGuard)
export class ModerationController {
  constructor(@Inject(ModerationService) private readonly moderation: ModerationService) {}

  private rethrowPublicError(error: unknown, correlationId: string): never {
    if (
      error instanceof ModerationTargetNotAvailableError ||
      error instanceof ModerationCaseNotAvailableError
    ) {
      throw new NotFoundException({
        code: 'MODERATION_RESOURCE_NOT_AVAILABLE',
        message: 'The moderation resource is not available.',
        correlationId,
      });
    }
    if (error instanceof ModerationOperatorAccessDeniedError) {
      throw new ForbiddenException({
        code: 'MODERATION_OPERATOR_ACCESS_DENIED',
        message: 'Operator access is required.',
        correlationId,
      });
    }
    if (error instanceof ModerationStateConflictError) {
      throw new ConflictException({
        code: 'MODERATION_STATE_CONFLICT',
        message: 'The moderation state does not allow this operation.',
        correlationId,
      });
    }
    if (error instanceof InvalidModerationCursorError) {
      throw new BadRequestException({
        code: 'INVALID_MODERATION_CURSOR',
        message: 'The moderation cursor is invalid.',
        correlationId,
      });
    }
    throw error;
  }

  @Post('reports')
  @HttpCode(201)
  async createReport(
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CreateReportResponse> {
    const input = parseBody<CreateReportRequest>(createReportSchema, body, request.id);
    try {
      return await this.moderation.createReport(
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Get('moderation/cases')
  async listCases(
    @Query() query: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<ModerationCaseListResponse> {
    const parsed = queueQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_MODERATION_QUERY',
        message: 'The moderation query is invalid.',
        correlationId: request.id,
      });
    }
    try {
      return await this.moderation.listCases(
        request.authenticatedHuman.accountId,
        parsed.data.limit,
        parsed.data.cursor,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Get('moderation/cases/:caseId')
  async getCase(
    @Param('caseId') caseId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<ModerationCaseResponse> {
    try {
      return await this.moderation.getCase(request.authenticatedHuman.accountId, caseId);
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('moderation/cases/:caseId/claim')
  async claimCase(
    @Param('caseId') caseId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<ModerationCaseResponse> {
    try {
      return await this.moderation.claimCase(
        request.authenticatedHuman.accountId,
        caseId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }
}
