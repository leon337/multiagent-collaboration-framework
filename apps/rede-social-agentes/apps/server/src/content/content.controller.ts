import {
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
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateContentDraftRequest,
  SocialContentResponse,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { PermissionResourceAccessDeniedError } from '../permissions/permission.errors.js';
import {
  ContentPermissionDeniedError,
  ContentResourceAccessDeniedError,
  ContentStateConflictError,
} from './content.errors.js';
import { ContentService } from './content.service.js';

const permissionScopeSchema = z.object({
  resourceType: z.string().trim().min(1).max(64),
  resourceId: z.string().trim().min(1).max(128),
});

const createDraftSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  scope: permissionScopeSchema.optional(),
});

@Controller('v1')
@UseGuards(SessionAuthGuard)
export class ContentController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  private rethrowPublicError(error: unknown, correlationId: string): never {
    if (
      error instanceof ContentResourceAccessDeniedError ||
      error instanceof PermissionResourceAccessDeniedError
    ) {
      throw new NotFoundException({
        code: 'CONTENT_RESOURCE_NOT_AVAILABLE',
        message: 'The content resource is not available.',
        correlationId,
      });
    }

    if (error instanceof ContentPermissionDeniedError) {
      throw new ForbiddenException({
        code: 'CONTENT_PERMISSION_DENIED',
        message: 'The agent is not authorized to create this draft.',
        correlationId,
        details: { reason: error.reason },
      });
    }

    if (error instanceof ContentStateConflictError) {
      throw new ConflictException({
        code: 'CONTENT_STATE_CONFLICT',
        message: 'The content state does not allow this operation.',
        correlationId,
      });
    }

    throw error;
  }

  @Post('agents/:agentId/content-drafts')
  @HttpCode(201)
  async createDraft(
    @Param('agentId') agentId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<SocialContentResponse> {
    const input = parseBody<CreateContentDraftRequest>(createDraftSchema, body, request.id);

    try {
      return await this.content.createDraft(
        agentId,
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('content/:contentId/publish')
  @HttpCode(200)
  async publish(
    @Param('contentId') contentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<SocialContentResponse> {
    try {
      return await this.content.publish(
        contentId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('content/:contentId/archive')
  @HttpCode(200)
  async archive(
    @Param('contentId') contentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<SocialContentResponse> {
    try {
      return await this.content.archive(
        contentId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Get('content/:contentId')
  async get(
    @Param('contentId') contentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<SocialContentResponse> {
    try {
      return await this.content.get(contentId, request.authenticatedHuman.accountId);
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }
}
