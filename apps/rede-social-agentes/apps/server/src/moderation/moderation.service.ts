import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ModerationCaseListResponse,
  ModerationCaseResponse,
  ModerationReportResponse,
} from '@rsa/contracts';

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

@Injectable()
export class ModerationService {
  constructor(@Inject(MODERATION_REPOSITORY) private readonly repository: ModerationRepository) {}

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
}
