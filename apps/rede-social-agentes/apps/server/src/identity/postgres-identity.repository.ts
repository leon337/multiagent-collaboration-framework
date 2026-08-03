import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { AccountStatus } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import { EmailAlreadyExistsError } from './identity.errors.js';
import type {
  CreateHumanAccountInput,
  CreateSessionInput,
  HumanAccountRecord,
  IdentityRepository,
} from './identity.repository.js';

interface HumanAccountRow extends DatabaseRow {
  id: string;
  email: string;
  display_name: string;
  status: AccountStatus;
  password_hash: string;
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

function mapAccount(row: HumanAccountRow): HumanAccountRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

@Injectable()
export class PostgresIdentityRepository implements IdentityRepository {
  constructor(private readonly database: DatabaseService) {}

  async createHumanAccount(input: CreateHumanAccountInput): Promise<HumanAccountRecord> {
    try {
      return await this.database.transaction(async (client) => {
        const accountResult = await client.query<HumanAccountRow>(
          `
            insert into "accounts" ("id", "email", "status", "password_hash")
            values ($1, $2, 'ACTIVE', $3)
            returning "id", "email", "status", "password_hash", "created_at"
          `,
          [input.id, input.email, input.passwordHash],
        );

        await client.query(
          `
            insert into "human_profiles" ("account_id", "display_name")
            values ($1, $2)
          `,
          [input.id, input.displayName],
        );

        await client.query(
          `
            insert into "audit_events" (
              "id", "actor_id", "actor_type", "event_type", "aggregate_type",
              "aggregate_id", "correlation_id", "payload"
            ) values ($1, $2, 'HUMAN', 'HUMAN_ACCOUNT_REGISTERED', 'ACCOUNT', $2, $3, $4)
          `,
          [randomUUID(), input.id, input.correlationId, { email: input.email }],
        );

        const row = accountResult.rows[0];
        if (!row) {
          throw new Error('Account insert did not return a row.');
        }

        return mapAccount({ ...row, display_name: input.displayName });
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }

  async findHumanAccountByEmail(email: string): Promise<HumanAccountRecord | null> {
    const result = await this.database.query<HumanAccountRow>(
      `
        select
          a."id",
          a."email",
          a."status",
          a."password_hash",
          a."created_at",
          p."display_name"
        from "accounts" a
        inner join "human_profiles" p on p."account_id" = a."id"
        where a."email" = $1
        limit 1
      `,
      [email],
    );

    const row = result.rows[0];
    return row ? mapAccount(row) : null;
  }

  async createSession(input: CreateSessionInput): Promise<void> {
    await this.database.transaction(async (client) => {
      await client.query(
        `
          insert into "sessions" ("id", "account_id", "token_hash", "expires_at")
          values ($1, $2, $3, $4)
        `,
        [input.sessionId, input.accountId, input.tokenHash, input.expiresAt],
      );

      await client.query(
        `
          insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload"
          ) values ($1, $2, 'HUMAN', 'SESSION_CREATED', 'SESSION', $3, $4, $5)
        `,
        [
          randomUUID(),
          input.accountId,
          input.sessionId,
          input.correlationId,
          { expiresAt: input.expiresAt.toISOString() },
        ],
      );
    });
  }
}
