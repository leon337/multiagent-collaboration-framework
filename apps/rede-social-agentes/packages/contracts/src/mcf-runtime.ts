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

export interface McfArtifactRef {
  artifactType: string;
  schemaVersion: string;
  projectId: string;
  revisionId: string;
  path: string;
  contentDigest: string;
  repository: string;
  commitSha: string | null;
}

export type IntentDimensionState =
  'CLEAR' | 'PARTIAL' | 'UNKNOWN' | 'CONFLICTING' | 'NOT_APPLICABLE';

export type PipLifecycle =
  'DISCOVERY_IN_PROGRESS' | 'READY_FOR_ALIGNMENT' | 'ALIGNED' | 'REOPENED_AFTER_MATERIAL_CHANGE';

export type ProvenanceType =
  | 'HUMAN_DIRECT_STATEMENT'
  | 'HUMAN_CONFIRMED_SYNTHESIS'
  | 'PRIOR_VALID_HUMAN_DECISION'
  | 'MACHINE_EVIDENCE'
  | 'MACHINE_INFERENCE'
  | 'TECHNICAL_DELEGATION'
  | 'NOT_APPLICABLE_JUSTIFICATION';

export interface ProvenanceRef {
  type: ProvenanceType;
  sourceRef: string;
  capturedAt: string;
  actor: string;
}

export interface IntentDimensionRecord {
  state: IntentDimensionState;
  value: unknown;
  provenance: ProvenanceRef[];
  readinessImpact: 'BLOCKING' | 'NON_BLOCKING' | 'NONE';
  notes?: string[] | undefined;
}

export interface HumanDecisionRecord {
  decisionId: string;
  status: 'CURRENT' | 'SUPERSEDED';
  statement: string;
  supersedesDecisionId?: string | undefined;
  provenance: ProvenanceRef[];
}

export interface ProjectIntentPackageV1 {
  artifactType: 'PROJECT_INTENT_PACKAGE';
  schemaVersion: '1.0';
  projectId: string;
  revisionId: string;
  lifecycle: PipLifecycle;
  methodologyPin: {
    version: string;
    immutableRef: string;
  };
  createdAt: string;
  supersedesRevisionId?: string | undefined;
  identity: {
    projectName?: string | undefined;
    repository?: string | undefined;
  };
  originalIntent: {
    text: string;
    provenance: ProvenanceRef[];
  };
  dimensions: {
    PROBLEM: IntentDimensionRecord;
    MOTIVATION: IntentDimensionRecord;
    DESIRED_OUTCOME: IntentDimensionRecord;
    TARGET_USERS: IntentDimensionRecord;
    CRITICAL_USER_JOURNEYS: IntentDimensionRecord;
    MUST_HAVE: IntentDimensionRecord;
    SHOULD_HAVE: IntentDimensionRecord;
    NON_GOALS: IntentDimensionRecord;
    PRIORITIES_AND_TRADEOFFS: IntentDimensionRecord;
    BUSINESS_RULES: IntentDimensionRecord;
    DATA_AND_SENSITIVITY: IntentDimensionRecord;
    ROLES_AND_PERMISSIONS: IntentDimensionRecord;
    AUTOMATION_LEVEL: IntentDimensionRecord;
    INTEGRATIONS: IntentDimensionRecord;
    PLATFORM_AND_USAGE_CONTEXT: IntentDimensionRecord;
    COST_AND_RESOURCE_CONSTRAINTS: IntentDimensionRecord;
    QUALITY_EXPECTATIONS: IntentDimensionRecord;
    FAILURE_TOLERANCE: IntentDimensionRecord;
    DEFINITION_OF_DONE: IntentDimensionRecord;
    FUTURE_VISION: IntentDimensionRecord;
  };
  humanDecisions: HumanDecisionRecord[];
  technicalDelegations: Array<{
    delegationId: string;
    domain: string;
    scope: string;
    provenance: ProvenanceRef[];
  }>;
  assumptions: Array<{
    id: string;
    statement: string;
    provenance: ProvenanceRef[];
  }>;
  unknowns: Array<{ id: string; statement: string; blocking: boolean }>;
  blockers: Array<{ id: string; statement: string }>;
  conflicts: Array<{ id: string; statement: string; sourceRefs: string[] }>;
  readiness: {
    state: 'NOT_READY' | 'CONDITIONALLY_READY' | 'READY_FOR_ALIGNMENT';
    blockingUnknownIds: string[];
    assessedAt: string;
  };
  alignment: {
    status: 'NOT_ALIGNED' | 'ALIGNED' | 'REOPENED';
    receiptRef?: string | undefined;
    alignedAt?: string | undefined;
  };
  contentDigest: string;
}

export type RealityAssertionKind = 'FACT' | 'INFERENCE' | 'UNKNOWN' | 'CONFLICTING';

export interface ProjectRealityReportV1 {
  artifactType: 'PROJECT_REALITY_REPORT';
  schemaVersion: '1.0';
  projectId: string;
  revisionId: string;
  methodologyPin: {
    version: string;
    immutableRef: string;
  };
  createdAt: string;
  baseline: {
    repository: string;
    commitSha: string;
    branch?: string | undefined;
    capturedAt: string;
  };
  observations: Array<{
    observationId: string;
    domain: string;
    statement: string;
    kind: RealityAssertionKind;
    evidenceRefs: string[];
    provenance: ProvenanceRef[];
  }>;
  unresolvedFacts: Array<{
    id: string;
    statement: string;
    evidenceNeeded: string[];
  }>;
  realityConfirmation: {
    status: 'PENDING' | 'CONFIRMED_WITH_CORRECTIONS' | 'CONFIRMED';
    confirmedAt?: string | undefined;
    correctionRefs?: string[] | undefined;
  };
  contentDigest: string;
}

export interface IntentAlignmentReceiptV1 {
  artifactType: 'INTENT_ALIGNMENT_RECEIPT';
  schemaVersion: '1.0';
  receiptId: string;
  projectId: string;
  pipRef: McfArtifactRef;
  decision: 'PASS' | 'REJECTED_FOR_CORRECTION';
  humanAuthority: 'LEANDRO';
  confirmedAt: string;
  confirmationSourceRef: string;
  contentDigest: string;
}

export type McfProjectEntryMode = 'NEW_PROJECT' | 'ADOPT_EXISTING_PROJECT' | 'RESUME_MCF_PROJECT';

export type McfProjectRecoveryRoute = 'RECOVER_MCF_PROJECT';

export type McfResumeRoute = 'FAST_RESUME' | 'RECONCILE' | McfProjectRecoveryRoute;

export interface McfStandingAuthorization {
  authorizationId: string;
  projectId: string;
  missionId?: string | undefined;
  grantedBy: 'LEANDRO';
  grantedAt: string;
  actionClasses: string[];
  environments: string[];
  maximumCost: {
    currency: string;
    amount: number;
    period?: string | undefined;
  } | null;
  reversibleOnly: boolean;
  expiresAt?: string | undefined;
  boundary?: string | undefined;
  exclusions: string[];
  evidenceRequirements: string[];
  sourceDecisionRef: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface McfMissionContractV11Extension {
  contractSchemaVersion?: '1.1' | undefined;
  projectId?: string | undefined;
  projectEntryMode?: McfProjectEntryMode | undefined;
  methodologyPin?:
    | {
        version: string;
        immutableRef: string;
      }
    | undefined;
  alignedPipRef?: McfArtifactRef | undefined;
  projectRealityReportRef?: McfArtifactRef | undefined;
  standingAuthorizations?: McfStandingAuthorization[] | undefined;
  continuityCheckpointRef?: McfArtifactRef | undefined;
}

export interface McfCheckpointV11Extension {
  schemaVersion?: '1.1' | undefined;
  projectId?: string | undefined;
  missionId?: string | undefined;
  methodologyPin?:
    | {
        version: string;
        immutableRef: string;
      }
    | undefined;
  alignedPipRef?: McfArtifactRef | undefined;
  missionContractRef?: string | undefined;
  projectRealityReportRef?: McfArtifactRef | undefined;
  pendingHumanGates?: string[] | undefined;
  activeStandingAuthorizationIds?: string[] | undefined;
  repositoryState?:
    | {
        repository: string;
        branch: string;
        checkpointSha: string | null;
        capturedAt: string;
        volatile: true;
      }
    | undefined;
  resumeRouteHint?: McfResumeRoute | undefined;
  transferability?: 'TRANSFERABLE' | 'BLOCKED_LOCAL_ONLY_STATE' | undefined;
}

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
  | 'EXTERNAL_ACTION_ABANDONED'
  | 'HANDOFF_CREATED'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'GATE_REQUIRED'
  | 'GATE_APPROVED'
  | 'GATE_REJECTED'
  | 'PHASE_COMPLETED'
  | 'MISSION_COMPLETED'
  | 'MISSION_BLOCKED_ALERT_RAISED'
  | 'CI_CALLBACK_RECEIVED';

export interface McfMissionContract extends McfMissionContractV11Extension {
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

export interface McfMissionBlockContext {
  reason: string;
  eventType: McfEventType | null;
  eventId: string | null;
  occurredAt: string | null;
  payload: Record<string, unknown>;
}

export interface McfMissionObservationResponse {
  mission: McfMissionResponse;
  currentPhase: {
    id: string;
    skillId: string;
    agentId: string;
    state: McfPhaseState;
    cycle: number;
    startedAt: string | null;
    updatedAt: string;
  } | null;
  latestEvent: McfMissionEventResponse | null;
  blocked: boolean;
  blockContext: McfMissionBlockContext | null;
}

export interface McfBlockedMissionSummary {
  missionId: string;
  title: string;
  state: 'BLOCKED_RISK';
  currentPhaseId: string | null;
  currentAgentId: string | null;
  version: number;
  updatedAt: string;
  blockContext: McfMissionBlockContext;
}

export interface McfBlockedMissionListResponse {
  missions: McfBlockedMissionSummary[];
  count: number;
  sourceOfTruth: 'MCF_PERSISTENCE_AND_EVENT_LEDGER';
}

export interface McfBlockedAlertReconcileResponse {
  blockedMissionsObserved: number;
  alertsInserted: number;
  duplicates: number;
  externalNotification: false;
  humanActionRequired: false;
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
  | 'MCF-RECOVER-CONTEXT'
  | 'MCF-DEFINE-PRODUCT'
  | 'MCF-DESIGN-EXPERIENCE'
  | 'MCF-DESIGN-ARCHITECTURE'
  | 'MCF-IMPLEMENT-CHANGE'
  | 'MCF-REVIEW-CODE'
  | 'MCF-RUN-TESTS'
  | 'MCF-GIT-PR-RELEASE'
  | 'MCF-DEPLOY-VALIDATE'
  | 'MCF-TRACE-MISSION'
  | 'MCF-EVALUATE-AGENTS'
  | 'MCF-SECURITY-REVIEW'
  | 'MCF-DEBUG-INCIDENT'
  | 'MCF-CLOSE-PHASE';

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
  state: 'PLANNED_INTERNAL' | 'COMPLETED' | 'READY_AGENT' | 'READY_EXTERNAL';
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
