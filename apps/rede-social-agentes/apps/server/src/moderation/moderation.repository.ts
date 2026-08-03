import type {
  ModerationActionType,
  ModerationCaseStatus,
  ModerationOperatorRole,
  ModerationPriority,
  ModerationReportReason,
  ModerationTargetType,
} from '@rsa/contracts';

import type { ModerationCursor } from './moderation.cursor.js';

export const MODERATION_REPOSITORY = Symbol('MODERATION_REPOSITORY');

export interface ModerationCaseRecord {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  primaryReason: ModerationReportReason;
  status: ModerationCaseStatus;
  priority: ModerationPriority;
  reportCount: number;
  assignedToAccountId: string | null;
  openedAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface ModerationReportRecord {
  id: string;
  caseId: string;
  reporterAccountId: string;
  reason: ModerationReportReason;
  details: string | null;
  createdAt: Date;
}

export interface ModerationAppealRecord {
  id: string;
  caseId: string;
  appellantAccountId: string;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'OVERTURNED';
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ModerationCasePageRecord {
  items: ModerationCaseRecord[];
  hasMore: boolean;
}

export interface SupervisionOverviewRecord {
  openCases: number;
  urgentCases: number;
  inReviewCases: number;
  appealedCases: number;
  oldestOpenCaseAt: Date | null;
  generatedAt: Date;
}

export interface ModerationRepository {
  createReport(input: {
    reportId: string;
    caseId: string;
    reporterAccountId: string;
    targetType: ModerationTargetType;
    targetId: string;
    reason: ModerationReportReason;
    details: string | null;
    correlationId: string;
  }): Promise<{ report: ModerationReportRecord; moderationCase: ModerationCaseRecord }>;
  getOperatorRole(accountId: string): Promise<ModerationOperatorRole | null>;
  listCases(input: {
    operatorAccountId: string;
    limit: number;
    cursor: ModerationCursor | null;
  }): Promise<ModerationCasePageRecord>;
  getCase(input: { operatorAccountId: string; caseId: string }): Promise<ModerationCaseRecord>;
  claimCase(input: {
    operatorAccountId: string;
    caseId: string;
    correlationId: string;
  }): Promise<ModerationCaseRecord>;
  resolveCase(input: {
    actionId: string;
    operatorAccountId: string;
    caseId: string;
    action: Exclude<ModerationActionType, 'REVERSE_ACTION'>;
    reason: string;
    evidence: Record<string, unknown>;
    correlationId: string;
  }): Promise<ModerationCaseRecord>;
  dismissCase(input: {
    operatorAccountId: string;
    caseId: string;
    reason: string;
    correlationId: string;
  }): Promise<ModerationCaseRecord>;
  createAppeal(input: {
    appealId: string;
    appellantAccountId: string;
    caseId: string;
    reason: string;
    correlationId: string;
  }): Promise<{ appeal: ModerationAppealRecord; moderationCase: ModerationCaseRecord }>;
  reverseCase(input: {
    actionId: string;
    supervisorAccountId: string;
    caseId: string;
    reason: string;
    evidence: Record<string, unknown>;
    correlationId: string;
  }): Promise<{ appeal: ModerationAppealRecord; moderationCase: ModerationCaseRecord }>;
  getOverview(operatorAccountId: string): Promise<SupervisionOverviewRecord>;
}
