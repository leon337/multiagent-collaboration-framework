import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CommentListResponse,
  CommentResponse,
  CreateCommentRequest,
  ReactionResponse,
  ReactionType,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  InteractionPermissionDeniedError,
  InteractionResourceNotAvailableError,
  InteractionStateConflictError,
  InvalidCommentCursorError,
} from './interaction.errors.js';
import { InteractionService } from './interaction.service.js';

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(1024).optional(),
});

const reactionSchema = z.enum(['LIKE', 'INSIGHTFUL', 'SUPPORT']);

@Controller('v1')
@UseGuards(SessionAuthGuard)
export class InteractionController {
  constructor(@Inject(InteractionService) private readonly interactions: InteractionService) {}

  private rethrowPublicError(error: unknown, correlationId: string): never {
    if (error instanceof InteractionResourceNotAvailableError) {
      throw new NotFoundException({
        code: 'INTERACTION_RESOURCE_NOT_AVAILABLE',
        message: 'The interaction resource is not available.',
        correlationId,
      });
    }
    if (error instanceof InteractionPermissionDeniedError) {
      throw new ForbiddenException({
        code: 'INTERACTION_PERMISSION_DENIED',
        message: 'The agent is not authorized to create this comment draft.',
        correlationId,
        details: { reason: error.reason },
      });
    }
    if (error instanceof InteractionStateConflictError) {
      throw new ConflictException({
        code: 'INTERACTION_STATE_CONFLICT',
        message: 'The interaction state does not allow this operation.',
        correlationId,
      });
    }
    if (error instanceof InvalidCommentCursorError) {
      throw new BadRequestException({
        code: 'INVALID_COMMENT_CURSOR',
        message: 'The comment cursor is invalid.',
        correlationId,
      });
    }
    throw error;
  }

  @Post('content/:contentId/comments')
  @HttpCode(201)
  async createHumanComment(
    @Param('contentId') contentId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommentResponse> {
    const input = parseBody<CreateCommentRequest>(commentSchema, body, request.id);
    try {
      return await this.interactions.createHumanComment(
        contentId,
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('agents/:agentId/content/:contentId/comment-drafts')
  @HttpCode(201)
  async createAgentCommentDraft(
    @Param('agentId') agentId: string,
    @Param('contentId') contentId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommentResponse> {
    const input = parseBody<CreateCommentRequest>(commentSchema, body, request.id);
    try {
      return await this.interactions.createAgentCommentDraft(
        agentId,
        contentId,
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('comments/:commentId/publish')
  async publishComment(
    @Param('commentId') commentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommentResponse> {
    try {
      return await this.interactions.publishComment(
        commentId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('comments/:commentId/archive')
  async archiveComment(
    @Param('commentId') commentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommentResponse> {
    try {
      return await this.interactions.archiveComment(
        commentId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Get('content/:contentId/comments')
  async listComments(
    @Param('contentId') contentId: string,
    @Query() query: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommentListResponse> {
    const parsed = listSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_COMMENT_QUERY',
        message: 'The comment query is invalid.',
        correlationId: request.id,
      });
    }
    try {
      return await this.interactions.listComments(contentId, parsed.data.limit, parsed.data.cursor);
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Put('content/:contentId/reactions/:reactionType')
  async setReaction(
    @Param('contentId') contentId: string,
    @Param('reactionType') reactionValue: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<ReactionResponse> {
    const parsed = reactionSchema.safeParse(reactionValue);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_REACTION_TYPE',
        message: 'The reaction type is invalid.',
        correlationId: request.id,
      });
    }
    try {
      return await this.interactions.setReaction(
        contentId,
        request.authenticatedHuman.accountId,
        parsed.data as ReactionType,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Delete('content/:contentId/reactions/:reactionType')
  async removeReaction(
    @Param('contentId') contentId: string,
    @Param('reactionType') reactionValue: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<ReactionResponse> {
    const parsed = reactionSchema.safeParse(reactionValue);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_REACTION_TYPE',
        message: 'The reaction type is invalid.',
        correlationId: request.id,
      });
    }
    try {
      return await this.interactions.removeReaction(
        contentId,
        request.authenticatedHuman.accountId,
        parsed.data as ReactionType,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }
}
