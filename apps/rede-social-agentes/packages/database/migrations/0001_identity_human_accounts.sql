CREATE TABLE "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "status" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "accounts_status_check" CHECK ("status" IN ('ACTIVE', 'SUSPENDED'))
);

CREATE TABLE "human_profiles" (
  "account_id" text PRIMARY KEY NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "display_name" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "human_profiles_display_name_length" CHECK (char_length("display_name") BETWEEN 2 AND 80)
);

CREATE TABLE "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "sessions_account_id_idx" ON "sessions" ("account_id");
CREATE INDEX "sessions_active_idx" ON "sessions" ("account_id", "expires_at") WHERE "revoked_at" IS NULL;

CREATE TABLE "audit_events" (
  "id" text PRIMARY KEY NOT NULL,
  "actor_id" text,
  "actor_type" text NOT NULL,
  "event_type" text NOT NULL,
  "aggregate_type" text NOT NULL,
  "aggregate_id" text NOT NULL,
  "correlation_id" text NOT NULL,
  "payload" jsonb NOT NULL,
  "occurred_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "audit_events_actor_type_check" CHECK ("actor_type" IN ('HUMAN', 'AGENT', 'SYSTEM'))
);

CREATE INDEX "audit_events_aggregate_idx" ON "audit_events" ("aggregate_type", "aggregate_id", "occurred_at");
CREATE INDEX "audit_events_correlation_idx" ON "audit_events" ("correlation_id");
