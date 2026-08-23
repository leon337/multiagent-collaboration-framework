import type { McfRiskClass } from './mcf-runtime.js';

export type McfWorkJobStatus =
  | 'WAITING_GATE'
  | 'QUEUED'
  | 'RUNNING'
  | 'RETRY_WAIT'
  | 'BLOCKED_AUTH'
  | 'BLOCKED_POLICY'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'DEAD'
  | 'CANCELLED';

export type McfWorkGateState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type McfWorkFailureKind = 'TRANSIENT' | 'AUTH' | 'POLICY' | 'PERMANENT';

export interface McfWorkJobSpec {
  dispatchId: string;
  objective: string;
  acceptanceCriteria: string[];
  repositoryKey: string;
  baseRef: string;
  expectedBaseSha: string;
  riskClass: McfRiskClass;
  writeScopeProfile: string;
  verificationProfiles: string[];
  missionId?: string | undefined;
  phaseId?: string | undefined;
  agentId?: string | undefined;
  requiresGate?: boolean | undefined;
  priority?: number | undefined;
  maxAttempts?: number | undefined;
}

export interface McfWorkFailure {
  code: string;
  message: string;
  kind: McfWorkFailureKind;
  retryable: boolean;
  statusCode?: number | null | undefined;
  details?: Record<string, unknown> | undefined;
}

export interface McfWorkVerificationResult {
  profile: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  exitCode: number | null;
  outputDigest: string | null;
}

export interface McfWorkResult {
  summary: string;
  artifactPath: string;
  patchDigest: string;
  changedFiles: string[];
  verification: McfWorkVerificationResult[];
  metadata?: Record<string, unknown> | undefined;
}

export interface McfWorkGateResponse {
  id: string;
  jobId: string;
  specDigest: string;
  state: McfWorkGateState;
  decidedBy: string | null;
  reason: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface McfWorkJobResponse {
  id: string;
  dispatchId: string;
  specDigest: string;
  spec: McfWorkJobSpec;
  missionId: string | null;
  phaseId: string | null;
  agentId: string | null;
  status: McfWorkJobStatus;
  gateRequired: boolean;
  priority: number;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string;
  leaseOwner: string | null;
  leaseToken: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
  cancellationRequested: boolean;
  result: McfWorkResult | null;
  failure: McfWorkFailure | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface McfClaimedWorkJob {
  job: McfWorkJobResponse;
  attemptId: string;
  attemptNumber: number;
  leaseToken: string;
}

export interface McfWorkJobListFilter {
  statuses?: McfWorkJobStatus[] | undefined;
  missionId?: string | undefined;
  repositoryKey?: string | undefined;
  limit?: number | undefined;
}

export interface McfWorkGateDecision {
  decision: 'APPROVE' | 'REJECT';
  specDigest: string;
  actor: string;
  reason: string;
  expiresAt?: string | null | undefined;
}

export interface McfWorkRecoverySummary {
  recoveredForRetry: number;
  movedToDead: number;
  expiredGates: number;
}
