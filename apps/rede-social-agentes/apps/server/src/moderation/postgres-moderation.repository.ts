import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  ModerationCaseStatus,
  ModerationOperatorRole,
  ModerationPriority,
  ModerationReportReason,
  ModerationTargetType,
} from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import {
  ModerationCaseNotAvailableError,
  ModerationOperatorAccessDeniedError,
  ModerationStateConflictError,
  ModerationTargetNotAvailableError,
} from './moderation.errors.js';
import type {
  ModerationCasePageRecord,
  ModerationCaseRecord,
  ModerationReportRecord,
  ModerationRepository,
} from './moderation.repository.js';

interface ModerationCaseRow extends DatabaseRow {
  id: string;
  target_type: ModerationTargetType;
  target_id: string;
  primary_reason: ModerationReportReason;
  status: ModerationCaseStatus;
  priority: ModerationPriority;
  report_count: number;
  assigned_to_account_id: string | null;
  opened_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}

interface ModerationReportRow extends DatabaseRow {
  id: string;
  case_id: string;
  reporter_account_id: string;
  reason: ModerationReportReason;
  details: string | null;
  created_at: Date;
}

interface RoleRow extends DatabaseRow {
  role: ModerationOperatorRole;
}

const caseColumns = `
  "id", "target_type", "target_id", "primary_reason", "status", "priority",
  "report_count", "assigned_to_account_id", "opened_at", "updated_at", "resolved_at"
`;

const reportColumns = `
  "id", "case_id", "reporter_account_id", "reason", "details", "created_at"
`;

const priorityRankSql = `
  case "priority"
    when 'URGENT' then 4
    when 'HIGH' then 3
    when 'NORMAL' then 2
    else 1
  end
`;

function mapCase(row: ModerationCaseRow): ModerationCaseRecord {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    primaryReason: row.primary_reason,
    status: row.status,
    priority: row.priority,
    reportCount: row.report_count,
    assignedToAccountId: row.assigned_to_account_id,
    openedAt: row.opened_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

function mapReport(row: ModerationReportRow): ModerationReportRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    reporterAccountId: row.reporter_account_id,
    reason: row.reason,
    details: row.details,
    createdAt: row.created_at,
  };
}

function priorityForReason(reason: ModerationReportReason): ModerationPriority {
  switch (reason) {
    case 'SECURITY':
    case 'ILLEGAL_CONTENT':
      return 'URGENT';
    case 'PRIVACY':
    case 'IMPERSONATION':
    case 'HARASSMENT':
      return 'HIGH';
    case 'SPAM':
      return 'NORMAL';
    case 'OTHER':
      return 'LOW';
  }
}

function priorityRank(priority: ModerationPriority): number {
  switch (priority) {
    case 'URGENT':
      return 4;
    case 'HIGH':
      return 3;
    case 'NORMAL':
      return 2;
    case 'LOW':
      return 1;
  }
}

async function ensureTargetAvailable(
  client: DatabaseTransaction,
  targetType: ModerationTargetType,
  targetId: string,
): Promise<void> {
  const queryByTarget: Record<ModerationTargetType, string> = {
    CONTENT: `select "id" from "social_content" where "id" = $1 and "status" = 'PUBLISHED'`,
    COMMENT: `select "id" from "social_comments" where "id" = $1 and "status" = 'PUBLISHED'`,
    AGENT: `select "id" from "agent_profiles" where "id" = $1 and "status" in ('ACTIVE', 'PAUSED', 'SUSPENDED')`,
    COMMUNITY: `select "id" from "communities" where "id" = $1 and "status" = 'ACTIVE'`,
  };
  const result = await client.query(queryByTarget[targetType], [targetId]);
  if (result.rowCount !== 1) {
    throw new ModerationTargetNotAvailableError();
  }
}

async function getOperatorRoleWithClient(
  client: DatabaseTransaction,
  accountId: string,
): Promise<ModerationOperatorRole> {
  const result = await client.query<RoleRow>(
    `
      select "role"
      from "account_platform_roles"
      where "account_id" = $1 and "status" = 'ACTIVE'
      order by case "role" when 'SUPERVISOR' then 2 else 1 end desc
      limit 1
    `,
    [accountId],
  );
  const role = result.rows[0]?.role;
  if (!role) {
    throw new ModerationOperatorAccessDeniedError();
  }
  return role;
}

async function writeAudit(
  client: DatabaseTransaction,
  input: {
    actorId: string;
    eventType: string;
    aggregateId: string;
    correlationId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `
      insert into "audit_events" (
        "id", "actor_id", "actor_type", "event_type", "aggregate_type",
        "aggregate_id", "correlation_id", "payload"
      ) values ($1, $2, 'HUMAN', $3, 'MODERATION_CASE', $4, $5, $6::jsonb)
    `,
    [
      randomUUID(),
      input.actorId,
      input.eventType,
      input.aggregateId,
      input.correlationId,
      JSON.stringify(input.payload),
    ],
  );
}

async function writeCaseEvent(
  client: DatabaseTransaction,
  input: {
    caseId: string;
    actorAccountId: string;
    actorRole: ModerationOperatorRole | null;
    eventType: string;
    fromStatus: ModerationCaseStatus | null;
    toStatus: ModerationCaseStatus;
    reason: string | null;
    evidence: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `
      insert into "moderation_case_events" (
        "id", "case_id", "actor_account_id", "actor_role", "event_type",
        "from_status", "to_status", "reason", "evidence"
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    `,
    [
      randomUUID(),
      input.caseId,
      input.actorAccountId,
      input.actorRole,
      input.eventType,
      input.fromStatus,
      input.toStatus,
      input.reason,
      JSON.stringify(input.evidence),
    ],
  );
}

@Injectable()
export class PostgresModerationRepository implements ModerationRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async createReport(input: {
    reportId: string;
    caseId: string;
    reporterAccountId: string;
    targetType: ModerationTargetType;
    targetId: string;
    reason: ModerationReportReason;
    details: string | null;
    correlationId: string;
  }): Promise<{ report: ModerationReportRecord; moderationCase: ModerationCaseRecord }> {
    return this.database.transaction(async (client) => {
      await ensureTargetAvailable(client, input.targetType, input.targetId);

      let moderationCase = (
        await client.query<ModerationCaseRow>(
          `
            select ${caseColumns}
            from "moderation_cases"
            where "target_type" = $1 and "target_id" = $2 and "primary_reason" = $3
              and "status" in ('OPEN', 'IN_REVIEW', 'APPEALED')
            limit 1
            for update
          `,
          [input.targetType, input.targetId, input.reason],
        )
      ).rows[0];

      let createdCase = false;
      if (!moderationCase) {
        moderationCase = (
          await client.query<ModerationCaseRow>(
            `
              insert into "moderation_cases" (
                "id", "target_type", "target_id", "primary_reason", "priority"
              ) values ($1, $2, $3, $4, $5)
              returning ${caseColumns}
            `,
            [
              input.caseId,
              input.targetType,
              input.targetId,
              input.reason,
              priorityForReason(input.reason),
            ],
          )
        ).rows[0];
        createdCase = true;
      }

      if (!moderationCase) {
        throw new ModerationStateConflictError();
      }

      const insertedReport = (
        await client.query<ModerationReportRow>(
          `
            insert into "moderation_reports" (
              "id", "case_id", "reporter_account_id", "reason", "details"
            ) values ($1, $2, $3, $4, $5)
            on conflict ("case_id", "reporter_account_id", "reason") do nothing
            returning ${reportColumns}
          `,
          [input.reportId, moderationCase.id, input.reporterAccountId, input.reason, input.details],
        )
      ).rows[0];

      let report = insertedReport;
      if (!report) {
        report = (
          await client.query<ModerationReportRow>(
            `
              select ${reportColumns}
              from "moderation_reports"
              where "case_id" = $1 and "reporter_account_id" = $2 and "reason" = $3
              limit 1
            `,
            [moderationCase.id, input.reporterAccountId, input.reason],
          )
        ).rows[0];
      } else if (!createdCase) {
        moderationCase = (
          await client.query<ModerationCaseRow>(
            `
              update "moderation_cases"
              set "report_count" = "report_count" + 1, "updated_at" = now()
              where "id" = $1
              returning ${caseColumns}
            `,
            [moderationCase.id],
          )
        ).rows[0];
      }

      if (!report || !moderationCase) {
        throw new ModerationStateConflictError();
      }

      if (insertedReport) {
        await writeCaseEvent(client, {
          caseId: moderationCase.id,
          actorAccountId: input.reporterAccountId,
          actorRole: null,
          eventType: createdCase ? 'CASE_OPENED_BY_REPORT' : 'REPORT_ADDED_TO_CASE',
          fromStatus: createdCase ? null : moderationCase.status,
          toStatus: moderationCase.status,
          reason: input.reason,
          evidence: { reportId: report.id },
        });
        await writeAudit(client, {
          actorId: input.reporterAccountId,
          eventType: 'MODERATION_REPORT_CREATED',
          aggregateId: moderationCase.id,
          correlationId: input.correlationId,
          payload: {
            reportId: report.id,
            targetType: input.targetType,
            targetId: input.targetId,
            reason: input.reason,
          },
        });
      }

      return { report: mapReport(report), moderationCase: mapCase(moderationCase) };
    });
  }

  async getOperatorRole(accountId: string): Promise<ModerationOperatorRole | null> {
    const result = await this.database.query<RoleRow>(
      `
        select "role"
        from "account_platform_roles"
        where "account_id" = $1 and "status" = 'ACTIVE'
        order by case "role" when 'SUPERVISOR' then 2 else 1 end desc
        limit 1
      `,
      [accountId],
    );
    return result.rows[0]?.role ?? null;
  }

  async listCases(input: {
    operatorAccountId: string;
    limit: number;
    cursor: { priority: ModerationPriority; openedAt: Date; id: string } | null;
  }): Promise<ModerationCasePageRecord> {
    return this.database.transaction(async (client) => {
      await getOperatorRoleWithClient(client, input.operatorAccountId);
      const values: unknown[] = [input.limit + 1];
      let cursorCondition = '';
      if (input.cursor) {
        values.push(priorityRank(input.cursor.priority), input.cursor.openedAt, input.cursor.id);
        cursorCondition = `
          and (
            ${priorityRankSql} < $2
            or (${priorityRankSql} = $2 and "opened_at" > $3::timestamptz)
            or (
              ${priorityRankSql} = $2 and "opened_at" = $3::timestamptz and "id" > $4::text
            )
          )
        `;
      }
      const result = await client.query<ModerationCaseRow>(
        `
          select ${caseColumns}
          from "moderation_cases"
          where "status" in ('OPEN', 'IN_REVIEW', 'APPEALED')
          ${cursorCondition}
          order by ${priorityRankSql} desc, "opened_at" asc, "id" asc
          limit $1
        `,
        values,
      );
      return {
        items: result.rows.slice(0, input.limit).map(mapCase),
        hasMore: result.rows.length > input.limit,
      };
    });
  }

  async getCase(input: {
    operatorAccountId: string;
    caseId: string;
  }): Promise<ModerationCaseRecord> {
    return this.database.transaction(async (client) => {
      await getOperatorRoleWithClient(client, input.operatorAccountId);
      const result = await client.query<ModerationCaseRow>(
        `select ${caseColumns} from "moderation_cases" where "id" = $1`,
        [input.caseId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new ModerationCaseNotAvailableError();
      }
      return mapCase(row);
    });
  }

  async claimCase(input: {
    operatorAccountId: string;
    caseId: string;
    correlationId: string;
  }): Promise<ModerationCaseRecord> {
    return this.database.transaction(async (client) => {
      const role = await getOperatorRoleWithClient(client, input.operatorAccountId);
      const current = (
        await client.query<ModerationCaseRow>(
          `select ${caseColumns} from "moderation_cases" where "id" = $1 for update`,
          [input.caseId],
        )
      ).rows[0];
      if (!current || !['OPEN', 'APPEALED', 'IN_REVIEW'].includes(current.status)) {
        throw new ModerationCaseNotAvailableError();
      }
      if (
        current.assigned_to_account_id &&
        current.assigned_to_account_id !== input.operatorAccountId
      ) {
        throw new ModerationStateConflictError();
      }
      if (
        current.status === 'IN_REVIEW' &&
        current.assigned_to_account_id === input.operatorAccountId
      ) {
        return mapCase(current);
      }

      const result = await client.query<ModerationCaseRow>(
        `
          update "moderation_cases"
          set "status" = 'IN_REVIEW', "assigned_to_account_id" = $2, "updated_at" = now()
          where "id" = $1
          returning ${caseColumns}
        `,
        [input.caseId, input.operatorAccountId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new ModerationStateConflictError();
      }
      await writeCaseEvent(client, {
        caseId: input.caseId,
        actorAccountId: input.operatorAccountId,
        actorRole: role,
        eventType: 'CASE_CLAIMED',
        fromStatus: current.status,
        toStatus: 'IN_REVIEW',
        reason: null,
        evidence: {},
      });
      await writeAudit(client, {
        actorId: input.operatorAccountId,
        eventType: 'MODERATION_CASE_CLAIMED',
        aggregateId: input.caseId,
        correlationId: input.correlationId,
        payload: { role, previousStatus: current.status },
      });
      return mapCase(row);
    });
  }
}
