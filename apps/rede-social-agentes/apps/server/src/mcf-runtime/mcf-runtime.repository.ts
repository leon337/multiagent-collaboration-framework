import type {
  McfEventType,
  McfEvidenceValidationStatus,
  McfMissionContract,
  McfMissionState,
  McfPermissionProfile,
  McfPhaseState,
  McfToolReceipt,
} from '@rsa/contracts';

export const MCF_RUNTIME_REPOSITORY = Symbol('MCF_RUNTIME_REPOSITORY');

export interface McfMissionRecord {
  id: string;
  contract: McfMissionContract;
  state: McfMissionState;
  currentPhaseId: string | null;
  currentAgentId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface McfPhaseRecord {
  id: string;
  missionId: string;
  skillId: string;
  agentId: string;
  state: McfPhaseState;
  cycle: number;
  inputs: Record<string, unknown>;
  expectedEvidence: string[];
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface McfEventRecord {
  id: string;
  missionId: string;
  phaseId: string | null;
  agentId: string | null;
  eventType: McfEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: Date;
}

export interface McfEventInput {
  id: string;
  missionId: string;
  phaseId: string | null;
  agentId: string | null;
  eventType: McfEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: Date;
}

export interface CreateMcfMissionInput {
  mission: McfMissionRecord;
  event: McfEventInput;
}

export interface PersistMcfExecutionInput {
  missionId: string;
  expectedMissionVersion: number;
  /** CAS on complete mission contract for finalization even if version is not bumped. */
  expectedMissionContract?: McfMissionContract | undefined;
  externalAttemptId?: string | null;
  phase: McfPhaseRecord;
  permissionProfile: McfPermissionProfile;
  missionState: McfMissionState;
  nextAgentId: string | null;
  receipt: McfToolReceipt | null;
  evidenceStatus: McfEvidenceValidationStatus;
  handoff: {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    objectiveState: Record<string, unknown>;
    delivered: string[];
    evidenceReceiptIds: string[];
    openFindings: string[];
    nextAction: string;
    acceptanceForNextAction: string;
    createdAt: Date;
  } | null;
  events: McfEventInput[];
}

export interface CompleteMcfPendingPhaseInput {
  missionId: string;
  phaseId: string;
  externalAttemptId?: string | null;
  receipt: McfToolReceipt;
  evidenceStatus: McfEvidenceValidationStatus;
  missionState: McfMissionState;
  phaseState: McfPhaseState;
  nextAgentId: string | null;
  handoff: {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    objectiveState: Record<string, unknown>;
    delivered: string[];
    evidenceReceiptIds: string[];
    openFindings: string[];
    nextAction: string;
    acceptanceForNextAction: string;
    createdAt: Date;
  } | null;
  callbackIdempotencyKey: string;
  events: McfEventInput[];
}

export interface CompleteMcfPendingPhaseResult {
  duplicate: boolean;
  mission: McfMissionRecord;
  phase: McfPhaseRecord;
  receiptId: string;
  evidenceStatus: McfEvidenceValidationStatus;
}

export interface CollectiveCloseoutBlockInput {
  missionId: string;
  expectedMissionVersion: number;
  phaseSkillId: string;
  reason: string;
  rosterRevision: number | null;
  rosterFingerprint: string;
  requiredAgentIds: string[];
}

export interface McfRuntimeRepository {
  /** Version-scoped, idempotent checkpoint in canonical event ledger. */
  recordCloseoutBlock?(input: CollectiveCloseoutBlockInput): Promise<void>;
  createMission(input: CreateMcfMissionInput): Promise<McfMissionRecord>;
  findMission(missionId: string): Promise<McfMissionRecord | null>;
  findPhase(missionId: string, phaseId: string): Promise<McfPhaseRecord | null>;
  persistExecution(
    input: PersistMcfExecutionInput,
  ): Promise<{ mission: McfMissionRecord; phase: McfPhaseRecord }>;
  completePendingPhase(input: CompleteMcfPendingPhaseInput): Promise<CompleteMcfPendingPhaseResult>;
  listEvents(missionId: string): Promise<McfEventRecord[]>;
}
