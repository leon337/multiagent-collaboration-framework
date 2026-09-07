import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow } from '@rsa/database';
import { BootstrapDatabaseService } from './bootstrap-database.service.js';
import type {
  InitialHumanBootstrapCreateInput,
  InitialHumanBootstrapRepository,
} from './initial-human-bootstrap.service.js';

interface ExistingAccountRow extends DatabaseRow {
  id: string;
}

interface CreatedAccountRow extends DatabaseRow {
  created_at: Date;
}

@Injectable()
export class PostgresInitialHumanBootstrapRepository implements InitialHumanBootstrapRepository {
  constructor(
    @Inject(BootstrapDatabaseService) private readonly database: BootstrapDatabaseService,
  ) {}

  async createInitialHuman(input: InitialHumanBootstrapCreateInput) {
    return this.database.transaction(async (client) => {
      await client.query('select pg_advisory_xact_lock(hashtext($1))', [
        'human-authority-initial-human',
      ]);
      await client.query('lock table "accounts" in share row exclusive mode');
      const existing = await client.query<ExistingAccountRow>(
        'select "id" from "accounts" limit 1',
      );
      if (existing.rows[0]) return { status: 'ALREADY_INITIALIZED' as const };

      const account = await client.query<CreatedAccountRow>(
        `insert into "accounts" ("id","email","status","password_hash","created_at","updated_at")
         values ($1,$2,'ACTIVE',$3,$4,$4)
         returning "created_at"`,
        [input.accountId, input.email, input.passwordHash, input.now],
      );
      const createdAt = account.rows[0]?.created_at;
      if (!createdAt) throw new Error('Initial human account insert returned no row.');

      await client.query(
        `insert into "human_profiles" ("account_id","display_name","created_at","updated_at")
         values ($1,$2,$3,$3)`,
        [input.accountId, input.displayName, input.now],
      );
      await client.query(
        `insert into "sessions" ("id","account_id","token_hash","expires_at","created_at")
         values ($1,$2,$3,$4,$5)`,
        [input.sessionId, input.accountId, input.tokenHash, input.expiresAt, input.now],
      );
      await client.query(
        `insert into "audit_events" (
           "id","actor_id","actor_type","event_type","aggregate_type",
           "aggregate_id","correlation_id","payload","occurred_at"
         ) values ($1,$2,'HUMAN','HUMAN_ACCOUNT_REGISTERED','ACCOUNT',$2,$3,$4::jsonb,$5)`,
        [
          randomUUID(),
          input.accountId,
          input.correlationId,
          JSON.stringify({ accountType: 'HUMAN', bootstrap: true }),
          input.now,
        ],
      );
      await client.query(
        `insert into "audit_events" (
           "id","actor_id","actor_type","event_type","aggregate_type",
           "aggregate_id","correlation_id","payload","occurred_at"
         ) values ($1,$2,'HUMAN','SESSION_CREATED','SESSION',$3,$4,$5::jsonb,$6)`,
        [
          randomUUID(),
          input.accountId,
          input.sessionId,
          input.correlationId,
          JSON.stringify({ expiresAt: input.expiresAt.toISOString(), bootstrap: true }),
          input.now,
        ],
      );
      await client.query(
        `insert into "audit_events" (
           "id","actor_id","actor_type","event_type","aggregate_type",
           "aggregate_id","correlation_id","payload","occurred_at"
         ) values ($1,$2,'HUMAN','HUMAN_AUTHORITY_INITIAL_ACCOUNT_BOOTSTRAPPED','ACCOUNT',$2,$3,$4::jsonb,$5)`,
        [
          randomUUID(),
          input.accountId,
          input.correlationId,
          JSON.stringify({ target: 'STAGING', identityDisclosed: false }),
          input.now,
        ],
      );

      return { status: 'CREATED' as const, createdAt };
    });
  }
}
