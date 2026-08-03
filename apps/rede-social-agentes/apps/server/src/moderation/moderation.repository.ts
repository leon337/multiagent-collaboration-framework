import type {
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

export interface ModerationCasePageRecord {
  items: ModerationCaseRecord[];
  hasMore: boolean;
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
}
