import type {
  McfRiskClass,
} from './mcf-runtime.js';
import type {
  McfWorkFailure,
  McfWorkJobStatus,
  McfWorkResult,
} from './mcf-work-queue.js';

export type McfContinuityMissionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'RETRY_WAIT'
  | 'WAITING_GATE'
  | 'BLOCKED_AUTH'
  | 'BLOCKED_POLICY'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface McfContinuityStepSpec {
  stepKey: string;
  objective: string;
  acceptanceCriteria: string[];
  dependsOn?: string[] | undefined;
  riskClass?: McfRiskClass | undefined;
  writeScopeProfile?: string | undefined;
  verificationProfiles?: string[] | undefined;
  agentId?: string | undefined;
  requiresGate?: boolean | undefined;
  maxAttempts?: number | undefined;
}

export interface McfContinuityMissionSpec {
  dispatchId: string;
  projectKey: string;
  title: string;
  objective: string;
  acceptanceCriteria: string[];
  repositoryKey: string;
  baseRef: string;
  expectedBaseSha: string;
  riskClass: McfRiskClass;
  writeScopeProfile: string;
  verificationProfiles: string[];
  agentId?: string | undefined;
  priority?: number | undefined;
  steps: McfContinuityStepSpec[];
}

export interface McfContinuityStepResponse {
  jobId: string;
  stepKey: string;
  stepOrder: number;
  dependsOnStepKeys: string[];
  status: McfWorkJobStatus;
  stateVersion: number;
  attemptCount: number;
  maxAttempts: number;
  result: McfWorkResult | null;
  failure: McfWorkFailure | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface McfContinuityMissionResponse {
  id: string;
  dispatchId: string;
  specDigest: string;
  spec: McfContinuityMissionSpec;
  projectKey: string;
  repositoryKey: string;
  status: McfContinuityMissionStatus;
  stateVersion: number;
  fencingToken: number;
  currentStepKey: string | null;
  completedStepCount: number;
  totalStepCount: number;
  worktreePath: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
  cancellationRequested: boolean;
  result: McfWorkResult | null;
  failure: McfWorkFailure | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  steps: McfContinuityStepResponse[];
}

export interface McfContinuityMissionClaim {
  mission: McfContinuityMissionResponse;
  leaseToken: string;
  fencingToken: number;
  stateVersion: number;
}

export interface McfActiveMissionFilter {
  projectKey?: string | undefined;
  repositoryKey?: string | undefined;
  limit?: number | undefined;
}

export interface McfMissionLeaseInput {
  missionId: string;
  leaseToken: string;
  fencingToken: number;
}

export interface McfMissionHeartbeatInput extends McfMissionLeaseInput {
  leaseDurationMs: number;
}

export interface McfMissionVersionedLeaseInput extends McfMissionLeaseInput {
  expectedStateVersion: number;
}

export interface McfBeginMissionStepInput extends McfMissionVersionedLeaseInput {
  stepKey: string;
}

export interface McfBegunMissionStep {
  mission: McfContinuityMissionResponse;
  step: McfContinuityStepResponse;
  attemptId: string;
  attemptNumber: number;
}

export interface McfMissionArtifactInput {
  artifactKey: string;
  kind: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  mediaType: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface McfMissionArtifactResponse extends McfMissionArtifactInput {
  id: string;
  missionId: string;
  jobId: string | null;
  checkpointId: string | null;
  createdAt: string;
}

export interface McfMissionCheckpointInput {
  checkpointKey: string;
  summary: string;
  completedAcceptanceCriteria: string[];
  nextAction: string | null;
  repositoryState: {
    baseSha: string;
    headSha: string | null;
    patchDigest: string | null;
    worktreePath: string;
  };
  metadata?: Record<string, unknown> | undefined;
}

export interface McfMissionCheckpointResponse extends McfMissionCheckpointInput {
  id: string;
  sequence: string;
  missionId: string;
  jobId: string;
  stepKey: string;
  attemptNumber: number;
  stateVersion: number;
  fencingToken: number;
  result: McfWorkResult;
  createdAt: string;
}

export interface McfCompleteMissionStepInput extends McfMissionVersionedLeaseInput {
  stepKey: string;
  result: McfWorkResult;
  checkpoint: McfMissionCheckpointInput;
  artifacts?: McfMissionArtifactInput[] | undefined;
}

export interface McfCompletedMissionStep {
  mission: McfContinuityMissionResponse;
  checkpoint: McfMissionCheckpointResponse;
  duplicate: boolean;
}

export interface McfFailMissionStepInput extends McfMissionVersionedLeaseInput {
  stepKey: string;
  failure: McfWorkFailure;
}

export interface McfBindMissionWorktreeInput extends McfMissionVersionedLeaseInput {
  worktreePath: string;
}

export interface McfContinueMissionInput {
  missionId: string;
  expectedStateVersion: number;
  actor: string;
  reason: string;
  idempotencyKey: string;
}

export interface McfMissionEventQuery {
  afterSequence?: string | undefined;
  limit?: number | undefined;
}

export interface McfMissionWorkEventResponse {
  id: string;
  sequence: string;
  missionId: string;
  jobId: string | null;
  attemptId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: string;
}

export interface McfMissionRecoverySummary {
  recoveredForRetry: number;
  movedToFailed: number;
}
