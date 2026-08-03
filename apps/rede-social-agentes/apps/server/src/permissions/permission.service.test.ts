import { describe, expect, it } from 'vitest';

import type {
  EvaluatePermissionInput,
  GrantPermissionInput,
  PermissionDecisionRecord,
  PermissionGrantRecord,
  PermissionRepository,
  RevokePermissionInput,
} from './permission.repository.js';
import { PermissionService } from './permission.service.js';

class MemoryPermissionRepository implements PermissionRepository {
  grantInput: GrantPermissionInput | null = null;
  revokeInput: RevokePermissionInput | null = null;
  evaluateInput: EvaluatePermissionInput | null = null;

  async grantPermission(input: GrantPermissionInput): Promise<PermissionGrantRecord> {
    this.grantInput = input;
    return {
      id: input.id,
      agentId: input.agentId,
      grantedByAccountId: input.responsibleAccountId,
      permission: input.permission,
      scope: input.scope,
      quotaLimit: input.quotaLimit,
      quotaUsed: 0,
      validFrom: new Date('2026-08-03T01:00:00.000Z'),
      validUntil: input.validUntil,
      status: 'ACTIVE',
      revokedAt: null,
      createdAt: new Date('2026-08-03T01:00:00.000Z'),
    };
  }

  async revokePermission(input: RevokePermissionInput): Promise<PermissionGrantRecord> {
    this.revokeInput = input;
    return {
      id: input.grantId,
      agentId: input.agentId,
      grantedByAccountId: input.responsibleAccountId,
      permission: 'agent.profile.read',
      scope: null,
      quotaLimit: null,
      quotaUsed: 0,
      validFrom: new Date('2026-08-03T01:00:00.000Z'),
      validUntil: null,
      status: 'REVOKED',
      revokedAt: new Date('2026-08-03T01:10:00.000Z'),
      createdAt: new Date('2026-08-03T01:00:00.000Z'),
    };
  }

  async evaluatePermission(input: EvaluatePermissionInput): Promise<PermissionDecisionRecord> {
    this.evaluateInput = input;
    return {
      allowed: true,
      reason: 'ALLOWED',
      permission: input.permission,
      grantId: 'grant-1',
      quotaRemaining: 2,
      decidedAt: new Date('2026-08-03T01:15:00.000Z'),
    };
  }
}

describe('PermissionService', () => {
  it('normalizes optional grant fields into explicit repository values', async () => {
    const repository = new MemoryPermissionRepository();
    const service = new PermissionService(repository);

    const result = await service.grant(
      'agent-1',
      {
        permission: 'content.draft.create',
        scope: { resourceType: 'community', resourceId: 'community-1' },
        quotaLimit: 3,
        validUntil: '2026-08-04T01:00:00.000Z',
      },
      'account-1',
      'correlation-grant',
    );

    expect(repository.grantInput).toMatchObject({
      agentId: 'agent-1',
      responsibleAccountId: 'account-1',
      permission: 'content.draft.create',
      scope: { resourceType: 'community', resourceId: 'community-1' },
      quotaLimit: 3,
      correlationId: 'correlation-grant',
    });
    expect(repository.grantInput?.validUntil?.toISOString()).toBe('2026-08-04T01:00:00.000Z');
    expect(result.status).toBe('ACTIVE');
  });

  it('passes responsibility context to the transactional evaluator', async () => {
    const repository = new MemoryPermissionRepository();
    const service = new PermissionService(repository);

    const decision = await service.evaluate(
      'agent-1',
      { permission: 'agent.profile.read' },
      'account-1',
      'correlation-evaluate',
    );

    expect(repository.evaluateInput).toEqual({
      agentId: 'agent-1',
      responsibleAccountId: 'account-1',
      permission: 'agent.profile.read',
      scope: null,
      correlationId: 'correlation-evaluate',
    });
    expect(decision).toMatchObject({ allowed: true, reason: 'ALLOWED', quotaRemaining: 2 });
  });
});
