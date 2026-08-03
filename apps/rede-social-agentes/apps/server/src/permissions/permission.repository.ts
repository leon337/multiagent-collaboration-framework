import type {
  PermissionCode,
  PermissionDecisionReason,
  PermissionGrantStatus,
  PermissionScope,
} from '@rsa/contracts';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionGrantRecord {
  id: string;
  agentId: string;
  grantedByAccountId: string;
  permission: PermissionCode;
  scope: PermissionScope | null;
  quotaLimit: number | null;
  quotaUsed: number;
  validFrom: Date;
  validUntil: Date | null;
  status: PermissionGrantStatus;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface GrantPermissionInput {
  id: string;
  agentId: string;
  responsibleAccountId: string;
  permission: PermissionCode;
  scope: PermissionScope | null;
  quotaLimit: number | null;
  validUntil: Date | null;
  correlationId: string;
}

export interface RevokePermissionInput {
  grantId: string;
  agentId: string;
  responsibleAccountId: string;
  correlationId: string;
}

export interface EvaluatePermissionInput {
  agentId: string;
  permission: PermissionCode;
  scope: PermissionScope | null;
  correlationId: string;
}

export interface PermissionDecisionRecord {
  allowed: boolean;
  reason: PermissionDecisionReason;
  permission: PermissionCode;
  grantId: string | null;
  quotaRemaining: number | null;
  decidedAt: Date;
}

export interface PermissionRepository {
  grantPermission(input: GrantPermissionInput): Promise<PermissionGrantRecord>;
  revokePermission(input: RevokePermissionInput): Promise<PermissionGrantRecord>;
  evaluatePermission(input: EvaluatePermissionInput): Promise<PermissionDecisionRecord>;
}
