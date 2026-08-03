import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  CreateModerationAppealRequest,
  CreateReportRequest,
  CreateReportResponse,
  ModerationAppealResponse,
  ModerationCaseListResponse,
  ModerationCaseResponse,
  ModerationReportResponse,
  ResolveModerationCaseRequest,
  SupervisionOverviewResponse,
} from '@rsa/contracts';

import {
  MODERATION_DECISION_REPOSITORY,
  type ModerationAppealRecord,
  type ModerationDecisionRepository,
} from './moderation-decision.repository.js';
import { ModerationStateConflictError } from './moderation.errors.js';
import { decodeModerationCursor, encodeModerationCursor } from './moderation.cursor.js';
import {
  MODERATION_REPOSITORY,
  type ModerationCaseRecord,
  type ModerationReportRecord,
  type ModerationRepository,
} from './moderation.repository.js';

function mapCase(moderationCase: ModerationCaseRecord): ModerationCaseResponse {
  return {
    id: moderationCase.id,
    targetType: moderationCase.targetType,
    targetId: moderationCase.targetId,
    primaryReason: moderationCase.primaryReason,
    status: moderationCase.status,
    priority: moderationCase.priority,
    reportCount: moderationCase.reportCount,
    assignedToAccountId: moderationCase.assignedToAccountId,
    openedAt: moderationCase.openedAt.toISOString(),
    updatedAt: moderationCase.updatedAt.toISOString(),
    resolvedAt: moderationCase.resolvedAt?.toISOString() ?? null,
  };
}

function mapReport(report: ModerationReportRecord): ModerationReportResponse {
  return {
    id: report.id,
    caseId: report.caseId,
    reporterAccountId: report.reporterAccountId,
    reason: report.reason,
    details: report.details,
    createdAt: report.createdAt.toISOString(),
  };
}

function mapAppeal(appeal: ModerationAppealRecord): ModerationAppealResponse {
  return {
    id: appeal.id,
    caseId: appeal.caseId,
    appellantAccountId: appeal.appellantAccountId,
    reason: appeal.reason,
    status: appeal.status,
    createdAt: appeal.createdAt.toISOString(),
    resolvedAt: appeal.resolvedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class ModerationService {
  constructor(
    @Inject(MODERATION_REPOSITORY) private readonly repository: ModerationRepository,
    @Optional()
    @Inject(MODERATION_DECISION_REPOSITORY)
    private readonly decisions?: ModerationDecisionRepository,
  ) {}

  private decisionRepository(): ModerationDecisionRepository {
    if (!this.decisions) {
      throw new ModerationStateConflictError();
    }
    return this.decisions;
  }

  async createReport(
    request: CreateReportRequest,
    reporterAccountId: string,
    correlationId: string,
  ): Promise<CreateReportResponse> {
    const result = await this.repository.createReport({
      reportId: randomUUID(),
      caseId: randomUUID(),
      reporterAccountId,
      targetType: request.targetType,
      targetId: request.targetId,
      reason: request.reason,
      details: request.details?.trim() || null,
      correlationId,
    });
    return {
      report: mapReport(result.report),
      moderationCase: mapCase(result.moderationCase),
    };
  }

  async listCases(
    operatorAccountId: string,
    limit: number,
    cursorValue?: string,
  ): Promise<ModerationCaseListResponse> {
    const cursor = cursorValue ? decodeModerationCursor(cursorValue) : null;
    const page = await this.repository.listCases({ operatorAccountId, limit, cursor });
    const lastItem = page.items.at(-1);
    return {
      items: page.items.map(mapCase),
      nextCursor:
        page.hasMore && lastItem
          ? encodeModerationCursor({
              priority: lastItem.priority,
              openedAt: lastItem.openedAt,
              id: lastItem.id,
            })
          : null,
      hasMore: page.hasMore,
    };
  }

  async getCase(operatorAccountId: string, caseId: string): Promise<ModerationCaseResponse> {
    return mapCase(await this.repository.getCase({ operatorAccountId, caseId }));
  }

  async claimCase(
    operatorAccountId: string,
    caseId: string,
    correlationId: string,
  ): Promise<ModerationCaseResponse> {
    return mapCase(await this.repository.claimCase({ operatorAccountId, caseId, correlationId }));
  }

  async resolveCase(
    operatorAccountId: string,
    caseId: string,
    request: ResolveModerationCaseRequest,
    correlationId: string,
  ): Promise<ModerationCaseResponse> {
    return mapCase(
      await this.decisionRepository().resolveCase({
        actionId: randomUUID(),
        operatorAccountId,
        caseId,
        action: request.action,
        reason: request.reason.trim(),
        evidence: request.evidence ?? {},
        correlationId,
      }),
    );
  }

  async dismissCase(
    operatorAccountId: string,
    caseId: string,
    reason: string,
    correlationId: string,
  ): Promise<ModerationCaseResponse> {
    return mapCase(
      await this.decisionRepository().dismissCase({
        operatorAccountId,
        caseId,
        reason: reason.trim(),
        correlationId,
      }),
    );
  }

  async createAppeal(
    appellantAccountId: string,
    caseId: string,
    request: CreateModerationAppealRequest,
    correlationId: string,
  ): Promise<ModerationAppealResponse> {
    const result = await this.decisionRepository().createAppeal({
      appealId: randomUUID(),
      appellantAccountId,
      caseId,
      reason: request.reason.trim(),
      correlationId,
    });
    return mapAppeal(result.appeal);
  }

  async reverseCase(
    supervisorAccountId: string,
    caseId: string,
    reason: string,
    evidence: Record<string, unknown>,
    correlationId: string,
  ): Promise<ModerationAppealResponse> {
    const result = await this.decisionRepository().reverseCase({
      actionId: randomUUID(),
      supervisorAccountId,
      caseId,
      reason: reason.trim(),
      evidence,
      correlationId,
    });
    return mapAppeal(result.appeal);
  }

  async getOverview(operatorAccountId: string): Promise<SupervisionOverviewResponse> {
    const overview = await this.decisionRepository().getOverview(operatorAccountId);
    return {
      openCases: overview.openCases,
      urgentCases: overview.urgentCases,
      inReviewCases: overview.inReviewCases,
      appealedCases: overview.appealedCases,
      oldestOpenCaseAt: overview.oldestOpenCaseAt?.toISOString() ?? null,
      generatedAt: overview.generatedAt.toISOString(),
    };
  }
}
