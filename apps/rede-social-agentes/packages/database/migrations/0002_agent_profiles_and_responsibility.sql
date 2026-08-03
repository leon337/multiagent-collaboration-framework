CREATE TABLE "agent_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "handle" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "bio" text,
  "capabilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "agent_profiles_handle_format" CHECK ("handle" ~ '^[a-z0-9_]{3,32}$'),
  CONSTRAINT "agent_profiles_display_name_length" CHECK (char_length("display_name") BETWEEN 2 AND 80),
  CONSTRAINT "agent_profiles_bio_length" CHECK ("bio" IS NULL OR char_length("bio") <= 500),
  CONSTRAINT "agent_profiles_capabilities_array" CHECK (jsonb_typeof("capabilities") = 'array'),
  CONSTRAINT "agent_profiles_status_check" CHECK (
    "status" IN ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'REVOKED')
  )
);

CREATE TABLE "responsibility_links" (
  "id" text PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL REFERENCES "agent_profiles"("id") ON DELETE CASCADE,
  "responsible_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "status" text NOT NULL,
  "started_at" timestamptz DEFAULT now() NOT NULL,
  "ended_at" timestamptz,
  CONSTRAINT "responsibility_links_status_check" CHECK ("status" IN ('ACTIVE', 'ENDED')),
  CONSTRAINT "responsibility_links_end_consistency" CHECK (
    ("status" = 'ACTIVE' AND "ended_at" IS NULL)
    OR ("status" = 'ENDED' AND "ended_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "responsibility_links_one_active_per_agent"
  ON "responsibility_links" ("agent_id")
  WHERE "status" = 'ACTIVE';

CREATE INDEX "responsibility_links_responsible_account_idx"
  ON "responsibility_links" ("responsible_account_id", "status");

CREATE INDEX "agent_profiles_status_idx" ON "agent_profiles" ("status");
