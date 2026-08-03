import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
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
  CommunityMemberListResponse,
  CommunityMemberResponse,
  CommunityResponse,
  CreateCommunityRequest,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  CommunityAgentNotAvailableError,
  CommunityNotAvailableError,
  CommunityStateConflictError,
  DuplicateCommunitySlugError,
  InvalidCommunityCursorError,
} from './community.errors.js';
import { CommunityService, normalizeCommunitySlug } from './community.service.js';

const createCommunitySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .refine((value) => {
      const normalized = normalizeCommunitySlug(value);
      return normalized.length >= 3 && normalized.length <= 64;
    }),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
});

const memberListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(1024).optional(),
});

@Controller('v1/communities')
@UseGuards(SessionAuthGuard)
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly communities: CommunityService) {}

  private rethrowPublicError(error: unknown, correlationId: string): never {
    if (
      error instanceof CommunityNotAvailableError ||
      error instanceof CommunityAgentNotAvailableError
    ) {
      throw new NotFoundException({
        code: 'COMMUNITY_RESOURCE_NOT_AVAILABLE',
        message: 'The community resource is not available.',
        correlationId,
      });
    }
    if (error instanceof DuplicateCommunitySlugError) {
      throw new ConflictException({
        code: 'COMMUNITY_SLUG_CONFLICT',
        message: 'The community slug is already in use.',
        correlationId,
      });
    }
    if (error instanceof CommunityStateConflictError) {
      throw new ConflictException({
        code: 'COMMUNITY_STATE_CONFLICT',
        message: 'The community state does not allow this operation.',
        correlationId,
      });
    }
    if (error instanceof InvalidCommunityCursorError) {
      throw new BadRequestException({
        code: 'INVALID_COMMUNITY_CURSOR',
        message: 'The community member cursor is invalid.',
        correlationId,
      });
    }
    throw error;
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityResponse> {
    const input = parseBody<CreateCommunityRequest>(createCommunitySchema, body, request.id);
    try {
      return await this.communities.create(
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Get(':communityId')
  async get(
    @Param('communityId') communityId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityResponse> {
    try {
      return await this.communities.get(communityId);
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post(':communityId/archive')
  async archive(
    @Param('communityId') communityId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityResponse> {
    try {
      return await this.communities.archive(
        communityId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post(':communityId/join')
  async joinHuman(
    @Param('communityId') communityId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityMemberResponse> {
    try {
      return await this.communities.joinHuman(
        communityId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Delete(':communityId/leave')
  async leaveHuman(
    @Param('communityId') communityId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityMemberResponse> {
    try {
      return await this.communities.leaveHuman(
        communityId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post(':communityId/agents/:agentId/join')
  async joinAgent(
    @Param('communityId') communityId: string,
    @Param('agentId') agentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityMemberResponse> {
    try {
      return await this.communities.joinAgent(
        communityId,
        agentId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Delete(':communityId/agents/:agentId/leave')
  async leaveAgent(
    @Param('communityId') communityId: string,
    @Param('agentId') agentId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityMemberResponse> {
    try {
      return await this.communities.leaveAgent(
        communityId,
        agentId,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Get(':communityId/members')
  async listMembers(
    @Param('communityId') communityId: string,
    @Query() query: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CommunityMemberListResponse> {
    const parsed = memberListSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_COMMUNITY_MEMBER_QUERY',
        message: 'The community member query is invalid.',
        correlationId: request.id,
      });
    }
    try {
      return await this.communities.listMembers(
        communityId,
        parsed.data.limit,
        parsed.data.cursor,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }
}
