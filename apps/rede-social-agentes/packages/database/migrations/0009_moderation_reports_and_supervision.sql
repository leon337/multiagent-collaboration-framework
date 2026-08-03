CREATE TABLE "account_platform_roles" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "granted_by_account_id" text REFERENCES "accounts"("id") ON DELETE SET NULL,
  "granted_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz,
  CONSTRAINT "account_platform_roles_role_check" CHECK (
    "role" IN ('MODERATOR', 'SUPERVISOR')
  ),
  CONSTRAINT "account_platform_roles_status_check" CHECK (
    "status" IN ('ACTIVE', 'REVOKED')
  ),
  CONSTRAINT "account_platform_roles_revoke_consistency" CHECK (
    ("status" = 'ACTIVE' AND "revoked_at" IS NULL)
    OR ("status" = 'REVOKED' AND "revoked_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "account_platform_roles_active_unique"
  ON "account_platform_roles" ("account_id", "role")
  WHERE "status" = 'ACTIVE';

CREATE TABLE "moderation_cases" (
  "id" text PRIMARY KEY NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "primary_reason" text NOT NULL,
  "status" text NOT NULL DEFAULT 'OPEN',
  "priority" text NOT NULL DEFAULT 'NORMAL',
  "report_count" integer NOT NULL DEFAULT 1,
  "assigned_to_account_id" text REFERENCES "accounts"("id") ON DELETE SET NULL,
  "opened_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz,
  CONSTRAINT "moderation_cases_target_type_check" CHECK (
    "target_type" IN ('CONTENT', 'COMMENT', 'AGENT', 'COMMUNITY')
  ),
  CONSTRAINT "moderation_cases_reason_check" CHECK (
    "primary_reason" IN (
      'SPAM', 'HARASSMENT', 'IMPERSONATION', 'PRIVACY',
      'SECURITY', 'ILLEGAL_CONTENT', 'OTHER'
    )
  ),
  CONSTRAINT "moderation_cases_status_check" CHECK (
    "status" IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'APPEALED')
  ),
  CONSTRAINT "moderation_cases_priority_check" CHECK (
    "priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  CONSTRAINT "moderation_cases_report_count_positive" CHECK ("report_count" >= 1),
  CONSTRAINT "moderation_cases_resolution_consistency" CHECK (
    ("status" IN ('RESOLVED', 'DISMISSED') AND "resolved_at" IS NOT NULL)
    OR ("status" NOT IN ('RESOLVED', 'DISMISSED') AND "resolved_at" IS NULL)
  )
);

CREATE UNIQUE INDEX "moderation_cases_active_target_reason_unique"
  ON "moderation_cases" ("target_type", "target_id", "primary_reason")
  WHERE "status" IN ('OPEN', 'IN_REVIEW', 'APPEALED');

CREATE INDEX "moderation_cases_queue_idx"
  ON "moderation_cases" (
    "priority" DESC,
    "opened_at" ASC,
    "id" ASC
  )
  WHERE "status" IN ('OPEN', 'IN_REVIEW', 'APPEALED');

CREATE TABLE "moderation_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL REFERENCES "moderation_cases"("id") ON DELETE CASCADE,
  "reporter_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "reason" text NOT NULL,
  "details" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "moderation_reports_reason_check" CHECK (
    "reason" IN (
      'SPAM', 'HARASSMENT', 'IMPERSONATION', 'PRIVACY',
      'SECURITY', 'ILLEGAL_CONTENT', 'OTHER'
    )
  ),
  CONSTRAINT "moderation_reports_details_length" CHECK (
    "details" IS NULL OR char_length("details") <= 4000
  )
);

CREATE UNIQUE INDEX "moderation_reports_reporter_reason_unique"
  ON "moderation_reports" ("case_id", "reporter_account_id", "reason");

CREATE TABLE "moderation_case_events" (
  "id" text PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL REFERENCES "moderation_cases"("id") ON DELETE CASCADE,
  "actor_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "actor_role" text,
  "event_type" text NOT NULL,
  "from_status" text,
  "to_status" text NOT NULL,
  "reason" text,
  "evidence" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "moderation_case_events_actor_role_check" CHECK (
    "actor_role" IS NULL OR "actor_role" IN ('MODERATOR', 'SUPERVISOR')
  ),
  CONSTRAINT "moderation_case_events_status_check" CHECK (
    ("from_status" IS NULL OR "from_status" IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'APPEALED'))
    AND "to_status" IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'APPEALED')
  )
);

CREATE INDEX "moderation_case_events_case_idx"
  ON "moderation_case_events" ("case_id", "created_at" ASC, "id" ASC);

CREATE TABLE "moderation_appeals" (
  "id" text PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL REFERENCES "moderation_cases"("id") ON DELETE CASCADE,
  "appellant_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "reason" text NOT NULL,
  "status" text NOT NULL DEFAULT 'OPEN',
  "reviewed_by_account_id" text REFERENCES "accounts"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz,
  CONSTRAINT "moderation_appeals_reason_length" CHECK (char_length("reason") BETWEEN 1 AND 4000),
  CONSTRAINT "moderation_appeals_status_check" CHECK (
    "status" IN ('OPEN', 'UPHELD', 'OVERTURNED')
  ),
  CONSTRAINT "moderation_appeals_resolution_consistency" CHECK (
    ("status" = 'OPEN' AND "resolved_at" IS NULL)
    OR ("status" IN ('UPHELD', 'OVERTURNED') AND "resolved_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "moderation_appeals_one_open_per_case"
  ON "moderation_appeals" ("case_id")
  WHERE "status" = 'OPEN';
