import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  CreatePermissionGrantRequest,
  EvaluatePermissionRequest,
  PermissionDecisionResponse,
  PermissionGrantResponse,
} from '@rsa/contracts';

import { DatabaseService } from '../database.service.js';
import {
  PERMISSION_REPOSITORY,
  type PermissionGrantRecord,
  type PermissionRepository,
} from './permission.repository.js';

function toGrantResponse(grant: PermissionGrantRecord): PermissionGrantResponse {
  return {
    id: grant.id,
    agentId: grant.agentId,
    grantedByAccountId: grant.grantedByAccountId,
    permission: grant.permission,
    scope: grant.scope,
    quotaLimit: grant.quotaLimit,
    quotaUsed: grant.quotaUsed,
    validFrom: grant.validFrom.toISOString(),
    validUntil: grant.validUntil?.toISOString() ?? null,
    status: grant.status,
    revokedAt: grant.revokedAt?.toISOString() ?? null,
    createdAt: grant.createdAt.toISOString(),
  };
}

@Injectable()
export class PermissionService {
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly repository: PermissionRepository,
    @Optional() @Inject(DatabaseService) legacyDatabase?: DatabaseService,
  ) {
    void legacyDatabase;
  }

  async grant(
    agentId: string,
    request: CreatePermissionGrantRequest,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<PermissionGrantResponse> {
    const grant = await this.repository.grantPermission({
      id: randomUUID(),
      agentId,
      responsibleAccountId,
      permission: request.permission,
      scope: request.scope ?? null,
      quotaLimit: request.quotaLimit ?? null,
      validUntil: request.validUntil ? new Date(request.validUntil) : null,
      correlationId,
    });

    return toGrantResponse(grant);
  }

  async revoke(
    agentId: string,
    grantId: string,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<PermissionGrantResponse> {
    const grant = await this.repository.revokePermission({
      agentId,
      grantId,
      responsibleAccountId,
      correlationId,
    });

    return toGrantResponse(grant);
  }

  async evaluate(
    agentId: string,
    request: EvaluatePermissionRequest,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<PermissionDecisionResponse> {
    const decision = await this.repository.evaluatePermission({
      agentId,
      responsibleAccountId,
      permission: request.permission,
      scope: request.scope ?? null,
      correlationId,
    });

    return {
      allowed: decision.allowed,
      reason: decision.reason,
      permission: decision.permission,
      grantId: decision.grantId,
      quotaRemaining: decision.quotaRemaining,
      decidedAt: decision.decidedAt.toISOString(),
    };
  }
}
