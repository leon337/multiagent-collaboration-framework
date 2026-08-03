import type { ModerationActionType, ModerationOperatorRole } from '@rsa/contracts';

import type { ModerationCaseRecord } from './moderation.repository.js';

export const MODERATION_DECISION_REPOSITORY = Symbol('MODERATION_DECISION_REPOSITORY');

export interface ModerationAppealRecord {
  id: string;
  caseId: string;
  appellantAccountId: string;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'OVERTURNED';
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface SupervisionOverviewRecord {
  openCases: number;
  urgentCases: number;
  inReviewCases: number;
  appealedCases: number;
  oldestOpenCaseAt: Date | null;
  generatedAt: Date;
}

export interface ModerationDecisionRepository {
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
  getOperatorRole(accountId: string): Promise<ModerationOperatorRole | null>;
}
