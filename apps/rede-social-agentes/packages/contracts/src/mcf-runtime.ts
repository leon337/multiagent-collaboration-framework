export type McfRiskClass = 'A' | 'B' | 'C';

export type McfMissionState =
  | 'PLANNED'
  | 'EXECUTING'
  | 'RECOVERING'
  | 'WAITING_EXTERNAL'
  | 'BLOCKED_RISK'
  | 'COMPLETED'
  | 'CANCELLED';

export type McfMissionReturnStatus = 'NOT_APPLICABLE' | 'PENDING' | 'COMPLETED';

export type McfPhaseState =
  'PLANNED' | 'EXECUTING' | 'WAITING_EVIDENCE' | 'RECOVERING' | 'FAILED' | 'COMPLETED';

export type McfPermissionProfile =
  'READ_ONLY' | 'READ_AND_PROPOSE' | 'SCOPED_WRITE' | 'SENSITIVE_CONTROLLED' | 'HUMAN_GATE';

export type McfToolReceiptStatus = 'SUCCEEDED' | 'FAILED' | 'PARTIAL';

export type McfEvidenceValidationStatus = 'VALID' | 'INVALID' | 'PENDING';

export type McfEventType =
  | 'MISSION_CREATED'
  | 'MISSION_STATE_CHANGED'
  | 'SUBMISSION_OPENED'
  | 'PARENT_RETURN_COMPLETED'
  | 'PARENT_RETURN_DEFERRED'
  | 'PARENT_MISSION_RESUMED'
  | 'PHASE_STARTED'
  | 'SKILL_SELECTED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_DENIED'
  | 'TOOL_REQUESTED'
  | 'TOOL_RECEIPT_RECORDED'
  | 'EVIDENCE_VALIDATED'
  | 'EVIDENCE_REJECTED'
  | 'EXTERNAL_ACTION_REQUESTED'
  | 'EXTERNAL_ACTION_ALLOWED'
  | 'EXTERNAL_ACTION_EXECUTED'
  | 'EXTERNAL_ACTION_FAILED'
  | 'EXTERNAL_ACTION_EVIDENCE_VALIDATED'
  | 'HANDOFF_CREATED'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'GATE_REQUIRED'
  | 'GATE_APPROVED'
  | 'GATE_REJECTED'
  | 'PHASE_COMPLETED'
  | 'MISSION_COMPLETED'
  | 'CI_CALLBACK_RECEIVED';

export interface McfMissionContract {
  title: string;
  objective: string;
  expectedOutcome: string;
  scope: string[];
  outOfScope: string[];
  acceptanceCriteria: string[];
  riskClass: McfRiskClass;
  selectedAgents: string[];
  selectedSkills: string[];
  sourceOfTruth: string[];
  parentMissionId?: string | null | undefined;
  returnToAgentId?: string | null | undefined;
  returnStatus?: McfMissionReturnStatus | undefined;
}

export interface McfSkillDefinition {
  skillId: string;
  name: string;
  version: string;
  purpose: string;
  ownerAgents: string[];
  requiredInputs: string[];
  allowedTools: string[];
  forbiddenTools: string[];
  permissionProfile: McfPermissionProfile;
  executionSteps: string[];
  requiredEvidence: string[];
  acceptanceCriteria: string[];
  failureModes: string[];
  fallback: string;
  handoffTo: string;
}

export interface McfToolReceipt {
  receiptId: string;
  provider: string;
  operation: string;
  resource: string;
  externalId: string | null;
  commitSha: string | null;
  status: McfToolReceiptStatus;
  observedAt: string;
  payloadDigest: string;
  signature: string;
  metadata: Record<string, unknown>;
}

export interface CreateMcfMissionRequest {
  contract: McfMissionContract;
}

export interface McfMissionResponse {
  id: string;
  contract: McfMissionContract;
  state: McfMissionState;
  currentPhaseId: string | null;
  currentAgentId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecuteMcfPhaseRequest {
  phaseId?: string | undefined;
  skillId: string;
  agentId: string;
  inputs: Record<string, unknown>;
  tool: {
    provider: string;
    operation: string;
    resource: string;
    externalReceipt?: McfToolReceipt | undefined;
  };
  expectedMissionVersion: number;
}

export interface McfPhaseExecutionResponse {
  mission: McfMissionResponse;
  phaseId: string;
  phaseState: McfPhaseState;
  selectedSkill: McfSkillDefinition;
  receipt: McfToolReceipt | null;
  evidenceStatus: McfEvidenceValidationStatus;
  handoffTo: string | null;
}

export interface McfMissionEventResponse {
  id: string;
  missionId: string;
  phaseId: string | null;
  agentId: string | null;
  eventType: McfEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: string;
}

export interface McfMissionTimelineResponse {
  mission: McfMissionResponse;
  events: McfMissionEventResponse[];
}

export interface McfSocialCandidateResponse {
  id: string;
  missionId: string;
  phaseId: string | null;
  kind: 'PHASE_COMPLETION' | 'MISSION_COMPLETION';
  title: string;
  summary: string;
  sourceEventId: string;
  status: 'DRAFT_REVIEW';
  createdAt: string;
}

export interface McfSocialTimelineResponse {
  candidates: McfSocialCandidateResponse[];
  automaticPublication: false;
  humanApprovalRequired: true;
}

export interface McfCiCallbackRequest {
  missionId: string;
  phaseId: string;
  workflowName: string;
  workflowRunId: string;
  repository: string;
  commitSha: string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'skipped';
  completedAt: string;
}

export interface McfCiCallbackResponse {
  accepted: true;
  duplicate: boolean;
  evidenceStatus: McfEvidenceValidationStatus;
  missionState: McfMissionState;
}

export type McfExecutableSkillId =
  | 'MCF-START-MISSION'
  | 'MCF-SELECT-AGENTS'
  | 'MCF-IMPLEMENT-CHANGE'
  | 'MCF-REVIEW-CODE'
  | 'MCF-RUN-TESTS'
  | 'MCF-GIT-PR-RELEASE'
  | 'MCF-DEPLOY-VALIDATE'
  | 'MCF-TRACE-MISSION';

export type McfExecutableToolProvider =
  'internal' | 'github' | 'github-actions' | 'render' | 'vercel' | 'cloudflare';

export interface McfChatDispatchRequest {
  objective: string;
  expectedOutcome?: string | undefined;
  repository?: string | undefined;
  sourceOfTruth?: string[] | undefined;
  requestedRiskClass?: McfRiskClass | undefined;
  requestedSkills?: McfExecutableSkillId[] | undefined;
}

export interface McfChatPlanStep {
  order: number;
  skillId: McfExecutableSkillId;
  agentId: string;
  handoffTo: string;
  toolProvider: McfExecutableToolProvider;
  toolOperation: string;
  toolResource: string;
  state: 'PLANNED_INTERNAL' | 'COMPLETED' | 'READY_EXTERNAL';
  requiredEvidence: string[];
}

export interface McfInternalExecutionResponse {
  skillId: McfExecutableSkillId;
  phaseId: string;
  evidenceStatus: McfEvidenceValidationStatus;
  handoffTo: string | null;
}

export interface McfChatDispatchResponse {
  mission: McfMissionResponse;
  bootstrapPhaseId: string;
  bootstrapEvidenceStatus: McfEvidenceValidationStatus;
  internalExecutions: McfInternalExecutionResponse[];
  plan: McfChatPlanStep[];
  nextAction: string;
  humanActionRequired: false;
}
