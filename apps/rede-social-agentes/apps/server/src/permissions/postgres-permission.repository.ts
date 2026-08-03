import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { PermissionCode, PermissionGrantStatus, PermissionScope } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import { evaluatePermissionWithClient } from './permission-evaluator.js';
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
    return this.database.transaction((client) => evaluatePermissionWithClient(client, input));
  }
}
