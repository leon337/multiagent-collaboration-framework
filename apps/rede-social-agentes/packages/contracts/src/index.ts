export type ActorType = 'HUMAN' | 'AGENT' | 'SYSTEM';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'REVOKED';
export type ResponsibleAgentTargetStatus = Extract<AgentStatus, 'ACTIVE' | 'PAUSED' | 'REVOKED'>;
export type PermissionCode =
  | 'agent.profile.read'
  | 'agent.audit.read'
  | 'content.draft.create'
  | 'content.comment.draft.create';
export type PermissionGrantStatus = 'ACTIVE' | 'REVOKED';
export type PermissionDecisionReason =
  'ALLOWED' | 'AGENT_NOT_ACTIVE' | 'PERMISSION_NOT_GRANTED' | 'GRANT_EXPIRED' | 'QUOTA_EXHAUSTED';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CommandEnvelope<TPayload> {
  commandId: string;
  correlationId: string;
  actorId: string;
  actorType: ActorType;
  issuedAt: string;
  payload: TPayload;
}

export interface DomainEvent<TPayload> {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  actorId: string;
  actorType: ActorType;
  payload: TPayload;
}

export interface PublicError {
  code: string;
  message: string;
  correlationId: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'ok';
  service: 'rede-social-agentes';
  component: 'server' | 'worker';
  timestamp: string;
}

export interface VersionResponse {
  service: 'rede-social-agentes';
  component: 'server';
  commitSha: string | null;
  branch: string | null;
  runtime: 'render' | 'local';
}

export interface RegisterHumanAccountRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface HumanAccountResponse {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  createdAt: string;
}

export interface CreateSessionRequest {
  email: string;
  password: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  token: string;
  expiresAt: string;
  account: HumanAccountResponse;
}

export interface RevokeSessionResponse {
  revoked: true;
}

export interface CreateAgentRequest {
  handle: string;
  displayName: string;
  bio?: string | undefined;
  capabilities: string[];
}

export interface AgentProfileResponse {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  capabilities: string[];
  status: AgentStatus;
  createdAt: string;
}

export interface ResponsibilityLinkResponse {
  id: string;
  agentId: string;
  responsibleAccountId: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt: string | null;
}

export interface CreateAgentResponse {
  agent: AgentProfileResponse;
  responsibility: ResponsibilityLinkResponse;
}

export interface ChangeAgentStateRequest {
  status: ResponsibleAgentTargetStatus;
}

export interface PermissionScope {
  resourceType: string;
  resourceId: string;
}

export interface CreatePermissionGrantRequest {
  permission: PermissionCode;
  scope?: PermissionScope | undefined;
  quotaLimit?: number | undefined;
  validUntil?: string | undefined;
}

export interface PermissionGrantResponse {
  id: string;
  agentId: string;
  grantedByAccountId: string;
  permission: PermissionCode;
  scope: PermissionScope | null;
  quotaLimit: number | null;
  quotaUsed: number;
  validFrom: string;
  validUntil: string | null;
  status: PermissionGrantStatus;
  revokedAt: string | null;
  createdAt: string;
}

export interface RevokePermissionGrantResponse {
  revoked: true;
  grant: PermissionGrantResponse;
}

export interface EvaluatePermissionRequest {
  permission: PermissionCode;
  scope?: PermissionScope | undefined;
}

export interface PermissionDecisionResponse {
  allowed: boolean;
  reason: PermissionDecisionReason;
  permission: PermissionCode;
  grantId: string | null;
  quotaRemaining: number | null;
  decidedAt: string;
}

export interface CreateContentDraftRequest {
  body: string;
  scope?: PermissionScope | undefined;
}

export interface SocialContentResponse {
  id: string;
  authorAgentId: string;
  responsibleAccountId: string;
  approvedByAccountId: string | null;
  communityId: string | null;
  body: string;
  status: ContentStatus;
  createdAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface FeedItemResponse {
  id: string;
  authorAgentId: string;
  authorHandle: string;
  authorDisplayName: string;
  approvedByAccountId: string;
  communityId: string | null;
  body: string;
  publishedAt: string;
}

export interface FeedResponse {
  items: FeedItemResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type {
  CommentAuthorType,
  CommentListResponse,
  CommentResponse,
  CommentStatus,
  CreateCommentRequest,
  ReactionResponse,
  ReactionType,
} from './interactions.js';

export type {
  CommunityMemberListResponse,
  CommunityMemberResponse,
  CommunityMemberRole,
  CommunityMemberStatus,
  CommunityMemberSubjectType,
  CommunityResponse,
  CommunityStatus,
  CreateCommunityRequest,
} from './communities.js';

export type {
  CreateModerationAppealRequest,
  CreateReportRequest,
  CreateReportResponse,
  ModerationActionType,
  ModerationAppealResponse,
  ModerationCaseListResponse,
  ModerationCaseResponse,
  ModerationCaseStatus,
  ModerationOperatorRole,
  ModerationPriority,
  ModerationReportReason,
  ModerationReportResponse,
  ModerationTargetType,
  ResolveModerationCaseRequest,
  SupervisionOverviewResponse,
} from './moderation.js';

export type {
  CreateMcfMissionRequest,
  ExecuteMcfPhaseRequest,
  HumanDecisionRecord,
  IntentAlignmentReceiptV1,
  IntentDimensionRecord,
  IntentDimensionState,
  McfArtifactRef,
  McfBlockedAlertReconcileResponse,
  McfBlockedMissionListResponse,
  McfBlockedMissionSummary,
  McfChatDispatchRequest,
  McfChatDispatchResponse,
  McfChatPlanStep,
  McfCheckpointV11Extension,
  McfCiCallbackRequest,
  McfCiCallbackResponse,
  McfEventType,
  McfEvidenceValidationStatus,
  McfExecutableSkillId,
  McfExecutableToolProvider,
  McfInternalExecutionResponse,
  McfMissionBlockContext,
  McfMissionContract,
  McfMissionContractV11Extension,
  McfMissionEventResponse,
  McfMissionObservationResponse,
  McfMissionResponse,
  McfMissionState,
  McfMissionTimelineResponse,
  McfPermissionProfile,
  McfPhaseExecutionResponse,
  McfPhaseState,
  McfProjectEntryMode,
  McfProjectRecoveryRoute,
  McfResumeRoute,
  McfRiskClass,
  McfSkillDefinition,
  McfSocialCandidateResponse,
  McfSocialTimelineResponse,
  McfStandingAuthorization,
  McfToolReceipt,
  McfToolReceiptStatus,
  PipLifecycle,
  ProjectIntentPackageV1,
  ProjectRealityReportV1,
  ProvenanceRef,
  ProvenanceType,
  RealityAssertionKind,
} from './mcf-runtime.js';

export type {
  McfClaimedWorkJob,
  McfWorkFailure,
  McfWorkFailureKind,
  McfWorkGateDecision,
  McfWorkGateResponse,
  McfWorkGateState,
  McfWorkJobListFilter,
  McfWorkJobResponse,
  McfWorkJobSpec,
  McfWorkJobStatus,
  McfWorkRecoverySummary,
  McfWorkResult,
  McfWorkVerificationResult,
} from './mcf-work-queue.js';

export type {
  McfActiveMissionFilter,
  McfBeginMissionStepInput,
  McfBegunMissionStep,
  McfBindMissionWorktreeInput,
  McfCompleteMissionStepInput,
  McfCompletedMissionStep,
  McfContinuityMissionClaim,
  McfContinuityMissionResponse,
  McfContinuityMissionSpec,
  McfContinuityMissionStatus,
  McfContinuityStepResponse,
  McfContinuityStepSpec,
  McfContinueMissionInput,
  McfFailMissionStepInput,
  McfMissionArtifactInput,
  McfMissionArtifactResponse,
  McfMissionCheckpointInput,
  McfMissionCheckpointResponse,
  McfMissionEventQuery,
  McfMissionHeartbeatInput,
  McfMissionLeaseInput,
  McfMissionRecoverySummary,
  McfMissionVersionedLeaseInput,
  McfMissionWorkEventResponse,
} from './mcf-mission-continuity.js';
