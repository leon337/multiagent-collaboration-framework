import {
  Body,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CreatePermissionGrantRequest,
  EvaluatePermissionRequest,
  PermissionDecisionResponse,
  PermissionGrantResponse,
  RevokePermissionGrantResponse,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  PermissionGrantAlreadyExistsError,
  PermissionResourceAccessDeniedError,
} from './permission.errors.js';
import { PermissionService } from './permission.service.js';

const permissionCodeSchema = z.enum([
  'agent.profile.read',
  'agent.audit.read',
  'content.draft.create',
]);

const permissionScopeSchema = z.object({
  resourceType: z.string().trim().min(1).max(64),
  resourceId: z.string().trim().min(1).max(128),
});

const createGrantSchema = z.object({
  permission: permissionCodeSchema,
  scope: permissionScopeSchema.optional(),
  quotaLimit: z.number().int().positive().max(10_000).optional(),
  validUntil: z.string().datetime({ offset: true }).optional(),
});

const evaluateSchema = z.object({
  permission: permissionCodeSchema,
  scope: permissionScopeSchema.optional(),
});

@Controller('v1/agents/:agentId/permissions')
@UseGuards(SessionAuthGuard)
export class PermissionController {
  constructor(@Inject(PermissionService) private readonly permissions: PermissionService) {}

  private rethrowPublicError(error: unknown, correlationId: string): never {
    if (error instanceof PermissionGrantAlreadyExistsError) {
      throw new ConflictException({
        code: 'PERMISSION_GRANT_ALREADY_EXISTS',
        message: 'An active grant already exists for this permission and scope.',
        correlationId,
      });
    }

    if (error instanceof PermissionResourceAccessDeniedError) {
      throw new NotFoundException({
        code: 'PERMISSION_RESOURCE_NOT_AVAILABLE',
        message: 'The permission resource is not available.',
        correlationId,
      });
    }

    throw error;
  }

  @Post()
  @HttpCode(201)
  async grant(
    @Param('agentId') agentId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<PermissionGrantResponse> {
    const input = parseBody<CreatePermissionGrantRequest>(createGrantSchema, body, request.id);

    try {
      return await this.permissions.grant(
        agentId,
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Delete(':grantId')
  @HttpCode(200)
  async revoke(
    @Param('agentId') agentId: string,
    @Param('grantId') grantId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<RevokePermissionGrantResponse> {
    try {
      const grant = await this.permissions.revoke(
        agentId,
        grantId,
        request.authenticatedHuman.accountId,
        request.id,
      );
      return { revoked: true, grant };
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }

  @Post('evaluate')
  @HttpCode(200)
  async evaluate(
    @Param('agentId') agentId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<PermissionDecisionResponse> {
    const input = parseBody<EvaluatePermissionRequest>(evaluateSchema, body, request.id);

    try {
      return await this.permissions.evaluate(
        agentId,
        input,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      this.rethrowPublicError(error, request.id);
    }
  }
}
