export type ModerationTargetType = 'CONTENT' | 'COMMENT' | 'AGENT' | 'COMMUNITY';
export type ModerationReportReason =
  'SPAM' | 'HARASSMENT' | 'IMPERSONATION' | 'PRIVACY' | 'SECURITY' | 'ILLEGAL_CONTENT' | 'OTHER';
export type ModerationCaseStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'APPEALED';
export type ModerationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ModerationOperatorRole = 'MODERATOR' | 'SUPERVISOR';
export type ModerationActionType =
  | 'NO_ACTION'
  | 'HIDE_CONTENT'
  | 'ARCHIVE_COMMENT'
  | 'PAUSE_AGENT'
  | 'ARCHIVE_COMMUNITY'
  | 'REVERSE_ACTION';

export interface CreateReportRequest {
  targetType: ModerationTargetType;
  targetId: string;
  reason: ModerationReportReason;
  details?: string | undefined;
}

export interface ModerationReportResponse {
  id: string;
  caseId: string;
  reporterAccountId: string;
  reason: ModerationReportReason;
  details: string | null;
  createdAt: string;
}

export interface ModerationCaseResponse {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  primaryReason: ModerationReportReason;
  status: ModerationCaseStatus;
  priority: ModerationPriority;
  reportCount: number;
  assignedToAccountId: string | null;
  openedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CreateReportResponse {
  report: ModerationReportResponse;
  moderationCase: ModerationCaseResponse;
}

export interface ModerationCaseListResponse {
  items: ModerationCaseResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ResolveModerationCaseRequest {
  action: Exclude<ModerationActionType, 'REVERSE_ACTION'>;
  reason: string;
  evidence?: Record<string, unknown> | undefined;
}

export interface CreateModerationAppealRequest {
  reason: string;
}

export interface ModerationAppealResponse {
  id: string;
  caseId: string;
  appellantAccountId: string;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'OVERTURNED';
  createdAt: string;
  resolvedAt: string | null;
}

export interface SupervisionOverviewResponse {
  openCases: number;
  urgentCases: number;
  inReviewCases: number;
  appealedCases: number;
  oldestOpenCaseAt: string | null;
  generatedAt: string;
}
