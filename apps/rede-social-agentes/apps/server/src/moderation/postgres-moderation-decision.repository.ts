import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  ModerationActionType,
  ModerationCaseStatus,
  ModerationOperatorRole,
  ModerationPriority,
  ModerationReportReason,
  ModerationTargetType,
} from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import type {
  ModerationAppealRecord,
  ModerationDecisionRepository,
  SupervisionOverviewRecord,
} from './moderation-decision.repository.js';
import {
  ModerationCaseNotAvailableError,
  ModerationOperatorAccessDeniedError,
  ModerationStateConflictError,
} from './moderation.errors.js';
import type { ModerationCaseRecord } from './moderation.repository.js';

interface CaseRow extends DatabaseRow {
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

interface RoleRow extends DatabaseRow {
  role: ModerationOperatorRole;
}

interface AppealRow extends DatabaseRow {
  id: string;
  case_id: string;
  appellant_account_id: string;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'OVERTURNED';
  created_at: Date;
  resolved_at: Date | null;
}

interface ActionRow extends DatabaseRow {
  id: string;
  action_type: ModerationActionType;
  target_type: ModerationTargetType;
  target_id: string;
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  reversed_at: Date | null;
}

interface StatusRow extends DatabaseRow {
  status: string;
}

interface EligibleRow extends DatabaseRow {
  eligible: boolean;
}

interface OverviewRow extends DatabaseRow {
  open_cases: string;
  urgent_cases: string;
  in_review_cases: string;
  appealed_cases: string;
  oldest_open_case_at: Date | null;
}

const caseColumns = `
  "id", "target_type", "target_id", "primary_reason", "status", "priority",
  "report_count", "assigned_to_account_id", "opened_at", "updated_at", "resolved_at"
`;

const appealColumns = `
  "id", "case_id", "appellant_account_id", "reason", "status", "created_at", "resolved_at"
`;

function mapCase(row: CaseRow): ModerationCaseRecord {
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

function mapAppeal(row: AppealRow): ModerationAppealRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    appellantAccountId: row.appellant_account_id,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

async function getRole(
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

async function lockCase(client: DatabaseTransaction, caseId: string): Promise<CaseRow> {
  const result = await client.query<CaseRow>(
    `select ${caseColumns} from "moderation_cases" where "id" = $1 for update`,
    [caseId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new ModerationCaseNotAvailableError();
  }
  return row;
}

function ensureAssignedReview(moderationCase: CaseRow, operatorAccountId: string): void {
  if (
    moderationCase.status !== 'IN_REVIEW' ||
    moderationCase.assigned_to_account_id !== operatorAccountId
  ) {
    throw new ModerationStateConflictError();
  }
}

function ensureActionAllowed(
  role: ModerationOperatorRole,
  targetType: ModerationTargetType,
  action: Exclude<ModerationActionType, 'REVERSE_ACTION'>,
): void {
  const expectedTarget: Partial<Record<ModerationActionType, ModerationTargetType>> = {
    HIDE_CONTENT: 'CONTENT',
    ARCHIVE_COMMENT: 'COMMENT',
    PAUSE_AGENT: 'AGENT',
    ARCHIVE_COMMUNITY: 'COMMUNITY',
  };
  const expected = expectedTarget[action];
  if (expected && expected !== targetType) {
    throw new ModerationStateConflictError();
  }
  if (role !== 'SUPERVISOR' && (action === 'PAUSE_AGENT' || action === 'ARCHIVE_COMMUNITY')) {
    throw new ModerationOperatorAccessDeniedError();
  }
}

async function applyRestrictiveAction(
  client: DatabaseTransaction,
  targetType: ModerationTargetType,
  targetId: string,
  action: Exclude<ModerationActionType, 'REVERSE_ACTION'>,
): Promise<{ previousState: Record<string, unknown>; newState: Record<string, unknown> }> {
  if (action === 'NO_ACTION') {
    return { previousState: {}, newState: {} };
  }

  const tableByAction: Record<
    Exclude<ModerationActionType, 'NO_ACTION' | 'REVERSE_ACTION'>,
    string
  > = {
    HIDE_CONTENT: 'social_content',
    ARCHIVE_COMMENT: 'social_comments',
    PAUSE_AGENT: 'agent_profiles',
    ARCHIVE_COMMUNITY: 'communities',
  };
  const expectedStatusByAction: Record<
    Exclude<ModerationActionType, 'NO_ACTION' | 'REVERSE_ACTION'>,
    string
  > = {
    HIDE_CONTENT: 'PUBLISHED',
    ARCHIVE_COMMENT: 'PUBLISHED',
    PAUSE_AGENT: 'ACTIVE',
    ARCHIVE_COMMUNITY: 'ACTIVE',
  };
  const nextStatusByAction: Record<
    Exclude<ModerationActionType, 'NO_ACTION' | 'REVERSE_ACTION'>,
    string
  > = {
    HIDE_CONTENT: 'ARCHIVED',
    ARCHIVE_COMMENT: 'ARCHIVED',
    PAUSE_AGENT: 'PAUSED',
    ARCHIVE_COMMUNITY: 'ARCHIVED',
  };

  const typedAction = action as Exclude<ModerationActionType, 'NO_ACTION' | 'REVERSE_ACTION'>;
  const table = tableByAction[typedAction];
  const current = await client.query<StatusRow>(
    `select "status" from "${table}" where "id" = $1 for update`,
    [targetId],
  );
  const currentStatus = current.rows[0]?.status;
  if (currentStatus !== expectedStatusByAction[typedAction]) {
    throw new ModerationStateConflictError();
  }

  if (typedAction === 'PAUSE_AGENT') {
    await client.query(
      `update "agent_profiles" set "status" = 'PAUSED', "updated_at" = now() where "id" = $1`,
      [targetId],
    );
  } else {
    await client.query(
      `update "${table}" set "status" = 'ARCHIVED', "archived_at" = now(), "updated_at" = now() where "id" = $1`,
      [targetId],
    );
  }

  return {
    previousState: { status: currentStatus },
    newState: { status: nextStatusByAction[typedAction] },
  };
}

async function reverseRestrictiveAction(
  client: DatabaseTransaction,
  action: ActionRow,
): Promise<void> {
  const previousStatus = action.previous_state.status;
  if (previousStatus !== 'PUBLISHED' && previousStatus !== 'ACTIVE') {
    throw new ModerationStateConflictError();
  }
  switch (action.action_type) {
    case 'HIDE_CONTENT':
      await client.query(
        `update "social_content" set "status" = 'PUBLISHED', "archived_at" = null, "updated_at" = now() where "id" = $1 and "status" = 'ARCHIVED'`,
        [action.target_id],
      );
      break;
    case 'ARCHIVE_COMMENT':
      await client.query(
        `update "social_comments" set "status" = 'PUBLISHED', "archived_at" = null, "updated_at" = now() where "id" = $1 and "status" = 'ARCHIVED'`,
        [action.target_id],
      );
      break;
    case 'PAUSE_AGENT':
      await client.query(
        `update "agent_profiles" set "status" = 'ACTIVE', "updated_at" = now() where "id" = $1 and "status" = 'PAUSED'`,
        [action.target_id],
      );
      break;
    case 'ARCHIVE_COMMUNITY':
      await client.query(
        `update "communities" set "status" = 'ACTIVE', "archived_at" = null, "updated_at" = now() where "id" = $1 and "status" = 'ARCHIVED'`,
        [action.target_id],
      );
      break;
    default:
      throw new ModerationStateConflictError();
  }
}

async function writeCaseEvent(
  client: DatabaseTransaction,
  input: {
    caseId: string;
    actorAccountId: string;
    actorRole: ModerationOperatorRole | null;
    eventType: string;
    fromStatus: ModerationCaseStatus;
    toStatus: ModerationCaseStatus;
    reason: string;
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

async function writeAudit(
  client: DatabaseTransaction,
  input: {
    actorId: string;
    eventType: string;
    caseId: string;
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
      input.caseId,
      input.correlationId,
      JSON.stringify(input.payload),
    ],
  );
}

async function findOpenAppeal(
  client: DatabaseTransaction,
  caseId: string,
): Promise<AppealRow | undefined> {
  return (
    await client.query<AppealRow>(
      `select ${appealColumns} from "moderation_appeals" where "case_id" = $1 and "status" = 'OPEN' limit 1 for update`,
      [caseId],
    )
  ).rows[0];
}

async function ensureAppealEligibility(
  client: DatabaseTransaction,
  moderationCase: CaseRow,
  accountId: string,
): Promise<void> {
  const queryByTarget: Record<ModerationTargetType, string> = {
    CONTENT: `select exists(select 1 from "social_content" where "id" = $1 and "responsible_account_id" = $2) as "eligible"`,
    COMMENT: `select exists(select 1 from "social_comments" where "id" = $1 and coalesce("responsible_account_id", "author_account_id") = $2) as "eligible"`,
    AGENT: `select exists(select 1 from "responsibility_links" where "agent_id" = $1 and "responsible_account_id" = $2 and "status" = 'ACTIVE') as "eligible"`,
    COMMUNITY: `select exists(select 1 from "communities" where "id" = $1 and "owner_account_id" = $2) as "eligible"`,
  };
  const result = await client.query<EligibleRow>(queryByTarget[moderationCase.target_type], [
    moderationCase.target_id,
    accountId,
  ]);
  if (result.rows[0]?.eligible !== true) {
    throw new ModerationCaseNotAvailableError();
  }
}

@Injectable()
export class PostgresModerationDecisionRepository implements ModerationDecisionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async getOperatorRole(accountId: string): Promise<ModerationOperatorRole | null> {
    const result = await this.database.query<RoleRow>(
      `
        select "role" from "account_platform_roles"
        where "account_id" = $1 and "status" = 'ACTIVE'
        order by case "role" when 'SUPERVISOR' then 2 else 1 end desc limit 1
      `,
      [accountId],
    );
    return result.rows[0]?.role ?? null;
  }

  async resolveCase(input: {
    actionId: string;
    operatorAccountId: string;
    caseId: string;
    action: Exclude<ModerationActionType, 'REVERSE_ACTION'>;
    reason: string;
    evidence: Record<string, unknown>;
    correlationId: string;
  }): Promise<ModerationCaseRecord> {
    return this.database.transaction(async (client) => {
      const role = await getRole(client, input.operatorAccountId);
      const moderationCase = await lockCase(client, input.caseId);
      ensureAssignedReview(moderationCase, input.operatorAccountId);
      ensureActionAllowed(role, moderationCase.target_type, input.action);
      const appeal = await findOpenAppeal(client, input.caseId);
      if (appeal && input.action !== 'NO_ACTION') {
        throw new ModerationStateConflictError();
      }

      const state = await applyRestrictiveAction(
        client,
        moderationCase.target_type,
        moderationCase.target_id,
        input.action,
      );
      await client.query(
        `
          insert into "moderation_actions" (
            "id", "case_id", "actor_account_id", "actor_role", "action_type",
            "reason", "evidence", "target_type", "target_id", "previous_state", "new_state"
          ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb, $11::jsonb)
        `,
        [
          input.actionId,
          input.caseId,
          input.operatorAccountId,
          role,
          input.action,
          input.reason,
          JSON.stringify(input.evidence),
          moderationCase.target_type,
          moderationCase.target_id,
          JSON.stringify(state.previousState),
          JSON.stringify(state.newState),
        ],
      );

      if (appeal) {
        await client.query(
          `
            update "moderation_appeals"
            set "status" = 'UPHELD', "reviewed_by_account_id" = $2,
                "resolved_at" = now()
            where "id" = $1
          `,
          [appeal.id, input.operatorAccountId],
        );
      }

      const resolved = (
        await client.query<CaseRow>(
          `
            update "moderation_cases"
            set "status" = 'RESOLVED', "resolved_at" = now(), "updated_at" = now()
            where "id" = $1
            returning ${caseColumns}
          `,
          [input.caseId],
        )
      ).rows[0];
      if (!resolved) {
        throw new ModerationStateConflictError();
      }
      await writeCaseEvent(client, {
        caseId: input.caseId,
        actorAccountId: input.operatorAccountId,
        actorRole: role,
        eventType: appeal ? 'APPEAL_UPHELD' : 'CASE_RESOLVED',
        fromStatus: 'IN_REVIEW',
        toStatus: 'RESOLVED',
        reason: input.reason,
        evidence: { actionId: input.actionId, action: input.action },
      });
      await writeAudit(client, {
        actorId: input.operatorAccountId,
        eventType: appeal ? 'MODERATION_APPEAL_UPHELD' : 'MODERATION_CASE_RESOLVED',
        caseId: input.caseId,
        correlationId: input.correlationId,
        payload: { actionId: input.actionId, action: input.action, role },
      });
      return mapCase(resolved);
    });
  }

  async dismissCase(input: {
    operatorAccountId: string;
    caseId: string;
    reason: string;
    correlationId: string;
  }): Promise<ModerationCaseRecord> {
    return this.database.transaction(async (client) => {
      const role = await getRole(client, input.operatorAccountId);
      const moderationCase = await lockCase(client, input.caseId);
      ensureAssignedReview(moderationCase, input.operatorAccountId);
      if (await findOpenAppeal(client, input.caseId)) {
        throw new ModerationStateConflictError();
      }
      const dismissed = (
        await client.query<CaseRow>(
          `
            update "moderation_cases"
            set "status" = 'DISMISSED', "resolved_at" = now(), "updated_at" = now()
            where "id" = $1
            returning ${caseColumns}
          `,
          [input.caseId],
        )
      ).rows[0];
      if (!dismissed) {
        throw new ModerationStateConflictError();
      }
      await writeCaseEvent(client, {
        caseId: input.caseId,
        actorAccountId: input.operatorAccountId,
        actorRole: role,
        eventType: 'CASE_DISMISSED',
        fromStatus: 'IN_REVIEW',
        toStatus: 'DISMISSED',
        reason: input.reason,
        evidence: {},
      });
      await writeAudit(client, {
        actorId: input.operatorAccountId,
        eventType: 'MODERATION_CASE_DISMISSED',
        caseId: input.caseId,
        correlationId: input.correlationId,
        payload: { role },
      });
      return mapCase(dismissed);
    });
  }

  async createAppeal(input: {
    appealId: string;
    appellantAccountId: string;
    caseId: string;
    reason: string;
    correlationId: string;
  }): Promise<{ appeal: ModerationAppealRecord; moderationCase: ModerationCaseRecord }> {
    return this.database.transaction(async (client) => {
      const moderationCase = await lockCase(client, input.caseId);
      if (moderationCase.status !== 'RESOLVED') {
        throw new ModerationCaseNotAvailableError();
      }
      await ensureAppealEligibility(client, moderationCase, input.appellantAccountId);
      const activeAction = await client.query<ActionRow>(
        `
          select "id", "action_type", "target_type", "target_id", "previous_state",
                 "new_state", "reversed_at"
          from "moderation_actions"
          where "case_id" = $1
            and "action_type" in ('HIDE_CONTENT', 'ARCHIVE_COMMENT', 'PAUSE_AGENT', 'ARCHIVE_COMMUNITY')
            and "reversed_at" is null
          limit 1
        `,
        [input.caseId],
      );
      if (!activeAction.rows[0]) {
        throw new ModerationCaseNotAvailableError();
      }

      let appeal = await findOpenAppeal(client, input.caseId);
      if (!appeal) {
        appeal = (
          await client.query<AppealRow>(
            `
              insert into "moderation_appeals" (
                "id", "case_id", "appellant_account_id", "reason"
              ) values ($1, $2, $3, $4)
              returning ${appealColumns}
            `,
            [input.appealId, input.caseId, input.appellantAccountId, input.reason],
          )
        ).rows[0];
      }
      if (!appeal) {
        throw new ModerationStateConflictError();
      }

      const appealedCase = (
        await client.query<CaseRow>(
          `
            update "moderation_cases"
            set "status" = 'APPEALED', "assigned_to_account_id" = null,
                "resolved_at" = null, "updated_at" = now()
            where "id" = $1
            returning ${caseColumns}
          `,
          [input.caseId],
        )
      ).rows[0];
      if (!appealedCase) {
        throw new ModerationStateConflictError();
      }
      await writeCaseEvent(client, {
        caseId: input.caseId,
        actorAccountId: input.appellantAccountId,
        actorRole: null,
        eventType: 'CASE_APPEALED',
        fromStatus: 'RESOLVED',
        toStatus: 'APPEALED',
        reason: input.reason,
        evidence: { appealId: appeal.id },
      });
      await writeAudit(client, {
        actorId: input.appellantAccountId,
        eventType: 'MODERATION_APPEAL_CREATED',
        caseId: input.caseId,
        correlationId: input.correlationId,
        payload: { appealId: appeal.id },
      });
      return { appeal: mapAppeal(appeal), moderationCase: mapCase(appealedCase) };
    });
  }

  async reverseCase(input: {
    actionId: string;
    supervisorAccountId: string;
    caseId: string;
    reason: string;
    evidence: Record<string, unknown>;
    correlationId: string;
  }): Promise<{ appeal: ModerationAppealRecord; moderationCase: ModerationCaseRecord }> {
    return this.database.transaction(async (client) => {
      const role = await getRole(client, input.supervisorAccountId);
      if (role !== 'SUPERVISOR') {
        throw new ModerationOperatorAccessDeniedError();
      }
      const moderationCase = await lockCase(client, input.caseId);
      ensureAssignedReview(moderationCase, input.supervisorAccountId);
      const appeal = await findOpenAppeal(client, input.caseId);
      if (!appeal) {
        throw new ModerationStateConflictError();
      }
      const original = (
        await client.query<ActionRow>(
          `
            select "id", "action_type", "target_type", "target_id", "previous_state",
                   "new_state", "reversed_at"
            from "moderation_actions"
            where "case_id" = $1
              and "action_type" in ('HIDE_CONTENT', 'ARCHIVE_COMMENT', 'PAUSE_AGENT', 'ARCHIVE_COMMUNITY')
              and "reversed_at" is null
            limit 1
            for update
          `,
          [input.caseId],
        )
      ).rows[0];
      if (!original) {
        throw new ModerationStateConflictError();
      }

      await reverseRestrictiveAction(client, original);
      await client.query(
        `
          update "moderation_actions"
          set "reversed_at" = now(), "reversed_by_account_id" = $2
          where "id" = $1
        `,
        [original.id, input.supervisorAccountId],
      );
      await client.query(
        `
          insert into "moderation_actions" (
            "id", "case_id", "actor_account_id", "actor_role", "action_type",
            "reason", "evidence", "target_type", "target_id", "previous_state",
            "new_state", "reverses_action_id"
          ) values ($1, $2, $3, 'SUPERVISOR', 'REVERSE_ACTION', $4, $5::jsonb,
                    $6, $7, $8::jsonb, $9::jsonb, $10)
        `,
        [
          input.actionId,
          input.caseId,
          input.supervisorAccountId,
          input.reason,
          JSON.stringify(input.evidence),
          original.target_type,
          original.target_id,
          JSON.stringify(original.new_state),
          JSON.stringify(original.previous_state),
          original.id,
        ],
      );
      const resolvedAppeal = (
        await client.query<AppealRow>(
          `
            update "moderation_appeals"
            set "status" = 'OVERTURNED', "reviewed_by_account_id" = $2,
                "resolved_at" = now()
            where "id" = $1
            returning ${appealColumns}
          `,
          [appeal.id, input.supervisorAccountId],
        )
      ).rows[0];
      const resolvedCase = (
        await client.query<CaseRow>(
          `
            update "moderation_cases"
            set "status" = 'RESOLVED', "resolved_at" = now(), "updated_at" = now()
            where "id" = $1
            returning ${caseColumns}
          `,
          [input.caseId],
        )
      ).rows[0];
      if (!resolvedAppeal || !resolvedCase) {
        throw new ModerationStateConflictError();
      }
      await writeCaseEvent(client, {
        caseId: input.caseId,
        actorAccountId: input.supervisorAccountId,
        actorRole: 'SUPERVISOR',
        eventType: 'MODERATION_ACTION_REVERSED',
        fromStatus: 'IN_REVIEW',
        toStatus: 'RESOLVED',
        reason: input.reason,
        evidence: { originalActionId: original.id, reverseActionId: input.actionId },
      });
      await writeAudit(client, {
        actorId: input.supervisorAccountId,
        eventType: 'MODERATION_APPEAL_OVERTURNED',
        caseId: input.caseId,
        correlationId: input.correlationId,
        payload: { originalActionId: original.id, reverseActionId: input.actionId },
      });
      return { appeal: mapAppeal(resolvedAppeal), moderationCase: mapCase(resolvedCase) };
    });
  }

  async getOverview(operatorAccountId: string): Promise<SupervisionOverviewRecord> {
    return this.database.transaction(async (client) => {
      await getRole(client, operatorAccountId);
      const row = (
        await client.query<OverviewRow>(
          `
            select
              count(*) filter (where "status" = 'OPEN')::text as "open_cases",
              count(*) filter (where "priority" = 'URGENT' and "status" in ('OPEN', 'IN_REVIEW', 'APPEALED'))::text as "urgent_cases",
              count(*) filter (where "status" = 'IN_REVIEW')::text as "in_review_cases",
              count(*) filter (where "status" = 'APPEALED')::text as "appealed_cases",
              min("opened_at") filter (where "status" in ('OPEN', 'IN_REVIEW', 'APPEALED')) as "oldest_open_case_at"
            from "moderation_cases"
          `,
        )
      ).rows[0];
      if (!row) {
        throw new ModerationStateConflictError();
      }
      return {
        openCases: Number(row.open_cases),
        urgentCases: Number(row.urgent_cases),
        inReviewCases: Number(row.in_review_cases),
        appealedCases: Number(row.appealed_cases),
        oldestOpenCaseAt: row.oldest_open_case_at,
        generatedAt: new Date(),
      };
    });
  }
}
