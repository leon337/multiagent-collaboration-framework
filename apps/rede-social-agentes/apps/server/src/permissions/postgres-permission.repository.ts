import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  AgentStatus,
  PermissionCode,
  PermissionGrantStatus,
  PermissionScope,
} from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import {
  PermissionGrantAlreadyExistsError,
  PermissionResourceAccessDeniedError,
} from './permission.errors.js';
import type {
  EvaluatePermissionInput,
  GrantPermissionInput,
  PermissionDecisionRecord,
  PermissionGrantRecord,
  PermissionRepository,
  RevokePermissionInput,
} from './permission.repository.js';

interface AgentStatusRow extends DatabaseRow {
  status: AgentStatus;
}

interface PermissionGrantRow extends DatabaseRow {
  id: string;
  agent_id: string;
  granted_by_account_id: string;
  permission_code: PermissionCode;
  scope: PermissionScope | null;
  quota_limit: number | null;
  quota_used: number;
  valid_from: Date;
  valid_until: Date | null;
  status: PermissionGrantStatus;
  revoked_at: Date | null;
  created_at: Date;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

function mapGrant(row: PermissionGrantRow): PermissionGrantRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    grantedByAccountId: row.granted_by_account_id,
    permission: row.permission_code,
    scope: row.scope,
    quotaLimit: row.quota_limit,
    quotaUsed: row.quota_used,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    status: row.status,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

async function writeDecisionAudit(
  client: DatabaseTransaction,
  input: EvaluatePermissionInput,
  decision: PermissionDecisionRecord,
): Promise<void> {
  await client.query(
    `
      insert into "audit_events" (
        "id", "actor_id", "actor_type", "event_type", "aggregate_type",
        "aggregate_id", "correlation_id", "payload"
      ) values ($1, $2, 'AGENT', $3, 'AGENT', $2, $4, $5::jsonb)
    `,
    [
      randomUUID(),
      input.agentId,
      decision.allowed ? 'PERMISSION_ALLOWED' : 'PERMISSION_DENIED',
      input.correlationId,
      JSON.stringify({
        permission: input.permission,
        scope: input.scope,
        reason: decision.reason,
        grantId: decision.grantId,
        quotaRemaining: decision.quotaRemaining,
      }),
    ],
  );
}

@Injectable()
export class PostgresPermissionRepository implements PermissionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async grantPermission(input: GrantPermissionInput): Promise<PermissionGrantRecord> {
    try {
      return await this.database.transaction(async (client) => {
        const responsibility = await client.query(
          `
            select "id"
            from "responsibility_links"
            where "agent_id" = $1
              and "responsible_account_id" = $2
              and "status" = 'ACTIVE'
            limit 1
          `,
          [input.agentId, input.responsibleAccountId],
        );

        if (responsibility.rowCount !== 1) {
          throw new PermissionResourceAccessDeniedError();
        }

        const result = await client.query<PermissionGrantRow>(
          `
            insert into "permission_grants" (
              "id", "agent_id", "granted_by_account_id", "permission_code",
              "scope", "quota_limit", "valid_until"
            ) values ($1, $2, $3, $4, $5::jsonb, $6, $7)
            returning
              "id", "agent_id", "granted_by_account_id", "permission_code",
              "scope", "quota_limit", "quota_used", "valid_from", "valid_until",
              "status", "revoked_at", "created_at"
          `,
          [
            input.id,
            input.agentId,
            input.responsibleAccountId,
            input.permission,
            input.scope ? JSON.stringify(input.scope) : null,
            input.quotaLimit,
            input.validUntil,
          ],
        );

        const row = result.rows[0];
        if (!row) {
          throw new Error('Permission grant creation did not return a record.');
        }

        await client.query(
          `
            insert into "audit_events" (
              "id", "actor_id", "actor_type", "event_type", "aggregate_type",
              "aggregate_id", "correlation_id", "payload"
            ) values ($1, $2, 'HUMAN', 'PERMISSION_GRANTED', 'PERMISSION_GRANT', $3, $4, $5::jsonb)
          `,
          [
            randomUUID(),
            input.responsibleAccountId,
            input.id,
            input.correlationId,
            JSON.stringify({
              agentId: input.agentId,
              permission: input.permission,
              scope: input.scope,
              quotaLimit: input.quotaLimit,
              validUntil: input.validUntil?.toISOString() ?? null,
            }),
          ],
        );

        return mapGrant(row);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PermissionGrantAlreadyExistsError();
      }
      throw error;
    }
  }

  async revokePermission(input: RevokePermissionInput): Promise<PermissionGrantRecord> {
    return this.database.transaction(async (client) => {
      const current = await client.query<PermissionGrantRow>(
        `
          select
            pg."id", pg."agent_id", pg."granted_by_account_id", pg."permission_code",
            pg."scope", pg."quota_limit", pg."quota_used", pg."valid_from",
            pg."valid_until", pg."status", pg."revoked_at", pg."created_at"
          from "permission_grants" pg
          join "responsibility_links" rl
            on rl."agent_id" = pg."agent_id"
           and rl."responsible_account_id" = $3
           and rl."status" = 'ACTIVE'
          where pg."id" = $1
            and pg."agent_id" = $2
            and pg."status" = 'ACTIVE'
          for update of pg
        `,
        [input.grantId, input.agentId, input.responsibleAccountId],
      );

      if (!current.rows[0]) {
        throw new PermissionResourceAccessDeniedError();
      }

      const updated = await client.query<PermissionGrantRow>(
        `
          update "permission_grants"
          set "status" = 'REVOKED', "revoked_at" = now(), "updated_at" = now()
          where "id" = $1
          returning
            "id", "agent_id", "granted_by_account_id", "permission_code",
            "scope", "quota_limit", "quota_used", "valid_from", "valid_until",
            "status", "revoked_at", "created_at"
        `,
        [input.grantId],
      );

      const row = updated.rows[0];
      if (!row) {
        throw new Error('Permission revocation did not return a record.');
      }

      await client.query(
        `
          insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload"
          ) values ($1, $2, 'HUMAN', 'PERMISSION_REVOKED', 'PERMISSION_GRANT', $3, $4, $5::jsonb)
        `,
        [
          randomUUID(),
          input.responsibleAccountId,
          input.grantId,
          input.correlationId,
          JSON.stringify({ agentId: input.agentId, permission: row.permission_code }),
        ],
      );

      return mapGrant(row);
    });
  }

  async evaluatePermission(input: EvaluatePermissionInput): Promise<PermissionDecisionRecord> {
    return this.database.transaction(async (client) => {
      const decidedAt = new Date();
      const agent = await client.query<AgentStatusRow>(
        'select "status" from "agent_profiles" where "id" = $1 for update',
        [input.agentId],
      );

      if (agent.rows[0]?.status !== 'ACTIVE') {
        const decision: PermissionDecisionRecord = {
          allowed: false,
          reason: 'AGENT_NOT_ACTIVE',
          permission: input.permission,
          grantId: null,
          quotaRemaining: null,
          decidedAt,
        };
        await writeDecisionAudit(client, input, decision);
        return decision;
      }

      const grantResult = await client.query<PermissionGrantRow>(
        `
          select
            "id", "agent_id", "granted_by_account_id", "permission_code",
            "scope", "quota_limit", "quota_used", "valid_from", "valid_until",
            "status", "revoked_at", "created_at"
          from "permission_grants"
          where "agent_id" = $1
            and "permission_code" = $2
            and "status" = 'ACTIVE'
            and ("scope" is null or "scope" = $3::jsonb)
          order by case when "scope" is null then 1 else 0 end
          limit 1
          for update
        `,
        [input.agentId, input.permission, input.scope ? JSON.stringify(input.scope) : null],
      );

      const grant = grantResult.rows[0];
      if (!grant) {
        const decision: PermissionDecisionRecord = {
          allowed: false,
          reason: 'PERMISSION_NOT_GRANTED',
          permission: input.permission,
          grantId: null,
          quotaRemaining: null,
          decidedAt,
        };
        await writeDecisionAudit(client, input, decision);
        return decision;
      }

      if (grant.valid_until && grant.valid_until.getTime() <= decidedAt.getTime()) {
        const decision: PermissionDecisionRecord = {
          allowed: false,
          reason: 'GRANT_EXPIRED',
          permission: input.permission,
          grantId: grant.id,
          quotaRemaining: grant.quota_limit === null ? null : Math.max(0, grant.quota_limit - grant.quota_used),
          decidedAt,
        };
        await writeDecisionAudit(client, input, decision);
        return decision;
      }

      if (grant.quota_limit !== null && grant.quota_used >= grant.quota_limit) {
        const decision: PermissionDecisionRecord = {
          allowed: false,
          reason: 'QUOTA_EXHAUSTED',
          permission: input.permission,
          grantId: grant.id,
          quotaRemaining: 0,
          decidedAt,
        };
        await writeDecisionAudit(client, input, decision);
        return decision;
      }

      let quotaRemaining: number | null = null;
      if (grant.quota_limit !== null) {
        const quota = await client.query<PermissionGrantRow>(
          `
            update "permission_grants"
            set "quota_used" = "quota_used" + 1, "updated_at" = now()
            where "id" = $1
              and "quota_used" < "quota_limit"
            returning
              "id", "agent_id", "granted_by_account_id", "permission_code",
              "scope", "quota_limit", "quota_used", "valid_from", "valid_until",
              "status", "revoked_at", "created_at"
          `,
          [grant.id],
        );
        const updated = quota.rows[0];
        if (!updated) {
          const denied: PermissionDecisionRecord = {
            allowed: false,
            reason: 'QUOTA_EXHAUSTED',
            permission: input.permission,
            grantId: grant.id,
            quotaRemaining: 0,
            decidedAt,
          };
          await writeDecisionAudit(client, input, denied);
          return denied;
        }
        quotaRemaining = updated.quota_limit === null ? null : updated.quota_limit - updated.quota_used;
      }

      const decision: PermissionDecisionRecord = {
        allowed: true,
        reason: 'ALLOWED',
        permission: input.permission,
        grantId: grant.id,
        quotaRemaining,
        decidedAt,
      };
      await writeDecisionAudit(client, input, decision);
      return decision;
    });
  }
}
