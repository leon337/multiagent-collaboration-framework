import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  AnonymizeAccountResponse,
  PrivacyAnonymizationBlocker,
  PrivacyExportResponse,
  PrivacyExportSection,
  PrivacyExportSectionName,
} from '@rsa/contracts/privacy';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import type {
  PrivacyAnonymizationResult,
  PrivacyCredentialRecord,
  PrivacyRepository,
} from './privacy.repository.js';

interface CredentialRow extends DatabaseRow {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ANONYMIZED';
  password_hash: string;
}

interface BlockerRow extends DatabaseRow {
  blocker: PrivacyAnonymizationBlocker;
}

interface CountRow extends DatabaseRow {
  count: number;
}

interface AnonymizedRow extends DatabaseRow {
  anonymized_at: Date;
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]),
    );
  }
  return value;
}

function normalizeRecords(rows: DatabaseRow[]): Record<string, unknown>[] {
  return rows.map((row) => normalizeValue(row) as Record<string, unknown>);
}

@Injectable()
export class PostgresPrivacyRepository implements PrivacyRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findCredential(accountId: string): Promise<PrivacyCredentialRecord | null> {
    const result = await this.database.query<CredentialRow>(
      `
        select "id", "status", "password_hash"
        from "accounts"
        where "id" = $1
        limit 1
      `,
      [accountId],
    );

    const row = result.rows[0];
    return row
      ? {
          accountId: row.id,
          status: row.status,
          passwordHash: row.password_hash,
        }
      : null;
  }

  async exportAccountData(
    accountId: string,
    correlationId: string,
  ): Promise<PrivacyExportResponse> {
    return this.database.transaction(async (client) => {
      const account = await client.query<DatabaseRow>(
        `
          select
            a."id",
            a."email",
            a."status",
            a."created_at",
            a."updated_at",
            a."anonymized_at",
            p."display_name",
            p."created_at" as "profile_created_at",
            p."updated_at" as "profile_updated_at"
          from "accounts" a
          inner join "human_profiles" p on p."account_id" = a."id"
          where a."id" = $1
          limit 1
        `,
        [accountId],
      );

      if (account.rowCount !== 1) {
        throw new Error('Privacy export account is not available.');
      }

      const queries: Array<{
        name: PrivacyExportSectionName;
        sql: string;
      }> = [
        {
          name: 'sessions',
          sql: `
            select "id", "expires_at", "revoked_at", "created_at"
            from "sessions"
            where "account_id" = $1
            order by "created_at" asc, "id" asc
          `,
        },
        {
          name: 'agents',
          sql: `
            select
              ap."id", ap."handle", ap."display_name", ap."bio", ap."capabilities",
              ap."status", ap."created_at", ap."updated_at",
              rl."id" as "responsibility_id", rl."status" as "responsibility_status",
              rl."started_at", rl."ended_at"
            from "responsibility_links" rl
            inner join "agent_profiles" ap on ap."id" = rl."agent_id"
            where rl."responsible_account_id" = $1
            order by rl."started_at" asc, rl."id" asc
          `,
        },
        {
          name: 'content',
          sql: `
            select
              "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
              "community_id", "body", "status", "created_at", "updated_at",
              "published_at", "archived_at"
            from "social_content"
            where "responsible_account_id" = $1 or "approved_by_account_id" = $1
            order by "created_at" asc, "id" asc
          `,
        },
        {
          name: 'comments',
          sql: `
            select
              "id", "content_id", "author_type", "author_account_id", "author_agent_id",
              "responsible_account_id", "approved_by_account_id", "body", "status",
              "created_at", "updated_at", "published_at", "archived_at"
            from "social_comments"
            where "author_account_id" = $1
               or "responsible_account_id" = $1
               or "approved_by_account_id" = $1
            order by "created_at" asc, "id" asc
          `,
        },
        {
          name: 'reactions',
          sql: `
            select "content_id", "reaction_type", "created_at", "updated_at"
            from "social_reactions"
            where "account_id" = $1
            order by "created_at" asc, "content_id" asc, "reaction_type" asc
          `,
        },
        {
          name: 'communities',
          sql: `
            select
              c."id", c."slug", c."name", c."description", c."owner_account_id",
              c."status", c."created_at", c."updated_at", c."archived_at",
              cm."id" as "membership_id", cm."subject_type", cm."account_id", cm."agent_id",
              cm."responsible_account_id", cm."role", cm."status" as "membership_status",
              cm."joined_at", cm."ended_at"
            from "communities" c
            left join "community_members" cm
              on cm."community_id" = c."id"
             and (cm."account_id" = $1 or cm."responsible_account_id" = $1)
            where c."owner_account_id" = $1 or cm."id" is not null
            order by c."created_at" asc, c."id" asc, cm."joined_at" asc, cm."id" asc
          `,
        },
        {
          name: 'moderation_reports',
          sql: `
            select
              mr."id", mr."case_id", mr."reason", mr."details", mr."created_at"
            from "moderation_reports" mr
            where mr."reporter_account_id" = $1
            order by mr."created_at" asc, mr."id" asc
          `,
        },
        {
          name: 'moderation_appeals',
          sql: `
            select
              "id", "case_id", "reason", "status", "reviewed_by_account_id",
              "created_at", "resolved_at"
            from "moderation_appeals"
            where "appellant_account_id" = $1
            order by "created_at" asc, "id" asc
          `,
        },
        {
          name: 'audit_events',
          sql: `
            select
              "id", "actor_type", "event_type", "aggregate_type", "aggregate_id",
              "correlation_id", "payload", "occurred_at"
            from "audit_events"
            where "actor_id" = $1
               or ("aggregate_type" = 'ACCOUNT' and "aggregate_id" = $1)
            order by "occurred_at" asc, "id" asc
          `,
        },
      ];

      const sections: PrivacyExportSection[] = [
        {
          name: 'account',
          records: normalizeRecords(account.rows),
        },
      ];

      for (const query of queries) {
        const result = await client.query<DatabaseRow>(query.sql, [accountId]);
        sections.push({ name: query.name, records: normalizeRecords(result.rows) });
      }

      const generatedAt = new Date();
      const requestId = randomUUID();
      await client.query(
        `
          insert into "privacy_requests" (
            "id", "account_id", "request_type", "status", "correlation_id",
            "metadata", "completed_at"
          ) values ($1, $2, 'EXPORT', 'COMPLETED', $3, $4::jsonb, $5)
        `,
        [
          requestId,
          accountId,
          correlationId,
          JSON.stringify({ sections: sections.map((section) => section.name) }),
          generatedAt,
        ],
      );
      await client.query(
        `
          insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload"
          ) values ($1, $2, 'HUMAN', 'ACCOUNT_DATA_EXPORTED', 'PRIVACY_REQUEST', $3, $4, $5::jsonb)
        `,
        [randomUUID(), accountId, requestId, correlationId, JSON.stringify({ sections: sections.length })],
      );

      return {
        accountId,
        generatedAt: generatedAt.toISOString(),
        sections,
      };
    });
  }

  async anonymizeAccount(
    accountId: string,
    correlationId: string,
  ): Promise<PrivacyAnonymizationResult> {
    return this.database.transaction(async (client) => {
      const account = await client.query<CredentialRow>(
        `
          select "id", "status", "password_hash"
          from "accounts"
          where "id" = $1
          for update
        `,
        [accountId],
      );
      if (account.rowCount !== 1 || account.rows[0]?.status !== 'ACTIVE') {
        throw new Error('Privacy account is not active.');
      }

      const blockersResult = await client.query<BlockerRow>(
        `
          select 'ACTIVE_AGENT_RESPONSIBILITY'::text as "blocker"
          where exists (
            select 1 from "responsibility_links"
            where "responsible_account_id" = $1 and "status" = 'ACTIVE'
          )
          union all
          select 'ACTIVE_OWNED_COMMUNITY'::text
          where exists (
            select 1 from "communities"
            where "owner_account_id" = $1 and "status" = 'ACTIVE'
          )
          union all
          select 'ACTIVE_PLATFORM_ROLE'::text
          where exists (
            select 1 from "account_platform_roles"
            where "account_id" = $1 and "status" = 'ACTIVE'
          )
          union all
          select 'ACTIVE_MODERATION_ASSIGNMENT'::text
          where exists (
            select 1 from "moderation_cases"
            where "assigned_to_account_id" = $1
              and "status" in ('OPEN', 'IN_REVIEW', 'APPEALED')
          )
        `,
        [accountId],
      );
      const blockers = blockersResult.rows.map((row) => row.blocker);
      const requestId = randomUUID();
      const completedAt = new Date();

      if (blockers.length > 0) {
        await client.query(
          `
            insert into "privacy_requests" (
              "id", "account_id", "request_type", "status", "correlation_id",
              "metadata", "completed_at"
            ) values ($1, $2, 'ANONYMIZATION', 'BLOCKED', $3, $4::jsonb, $5)
          `,
          [requestId, accountId, correlationId, JSON.stringify({ blockers }), completedAt],
        );
        await client.query(
          `
            insert into "audit_events" (
              "id", "actor_id", "actor_type", "event_type", "aggregate_type",
              "aggregate_id", "correlation_id", "payload"
            ) values ($1, $2, 'HUMAN', 'ACCOUNT_ANONYMIZATION_BLOCKED', 'PRIVACY_REQUEST', $3, $4, $5::jsonb)
          `,
          [randomUUID(), accountId, requestId, correlationId, JSON.stringify({ blockers })],
        );
        return { status: 'BLOCKED', blockers };
      }

      const revokedSessions = await client.query<CountRow>(
        `
          with updated as (
            update "sessions"
            set "revoked_at" = coalesce("revoked_at", now())
            where "account_id" = $1 and "revoked_at" is null
            returning 1
          )
          select count(*)::integer as "count" from updated
        `,
        [accountId],
      );
      const endedHumanMemberships = await client.query<CountRow>(
        `
          with updated as (
            update "community_members"
            set "status" = 'ENDED', "ended_at" = now()
            where "account_id" = $1 and "status" = 'ACTIVE' and "role" = 'MEMBER'
            returning 1
          )
          select count(*)::integer as "count" from updated
        `,
        [accountId],
      );
      const endedAgentMemberships = await client.query<CountRow>(
        `
          with updated as (
            update "community_members"
            set "status" = 'ENDED', "ended_at" = now()
            where "responsible_account_id" = $1 and "status" = 'ACTIVE'
            returning 1
          )
          select count(*)::integer as "count" from updated
        `,
        [accountId],
      );

      const anonymized = await client.query<AnonymizedRow>(
        `
          update "accounts"
          set
            "email" = $2,
            "status" = 'ANONYMIZED',
            "password_hash" = $3,
            "anonymized_at" = $4,
            "updated_at" = $4
          where "id" = $1
          returning "anonymized_at"
        `,
        [
          accountId,
          `anonymized+${accountId}@invalid.local`,
          `anonymized$${randomUUID()}`,
          completedAt,
        ],
      );
      await client.query(
        `
          update "human_profiles"
          set "display_name" = 'Conta anonimizada', "updated_at" = $2
          where "account_id" = $1
        `,
        [accountId, completedAt],
      );
      await client.query(
        `
          insert into "privacy_requests" (
            "id", "account_id", "request_type", "status", "correlation_id",
            "metadata", "completed_at"
          ) values ($1, $2, 'ANONYMIZATION', 'COMPLETED', $3, $4::jsonb, $5)
        `,
        [
          requestId,
          accountId,
          correlationId,
          JSON.stringify({
            sessionsRevoked: revokedSessions.rows[0]?.count ?? 0,
            membershipsEnded:
              (endedHumanMemberships.rows[0]?.count ?? 0) +
              (endedAgentMemberships.rows[0]?.count ?? 0),
          }),
          completedAt,
        ],
      );
      await client.query(
        `
          insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload"
          ) values ($1, $2, 'HUMAN', 'ACCOUNT_ANONYMIZED', 'PRIVACY_REQUEST', $3, $4, $5::jsonb)
        `,
        [randomUUID(), accountId, requestId, correlationId, JSON.stringify({ reversible: false })],
      );

      const anonymizedAt = anonymized.rows[0]?.anonymized_at ?? completedAt;
      const response: AnonymizeAccountResponse = {
        accountId,
        status: 'ANONYMIZED',
        anonymizedAt: anonymizedAt.toISOString(),
        sessionsRevoked: revokedSessions.rows[0]?.count ?? 0,
        membershipsEnded:
          (endedHumanMemberships.rows[0]?.count ?? 0) +
          (endedAgentMemberships.rows[0]?.count ?? 0),
      };
      return { status: 'COMPLETED', response };
    });
  }
}
