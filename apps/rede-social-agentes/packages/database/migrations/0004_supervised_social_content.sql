CREATE TABLE "social_content" (
  "id" text PRIMARY KEY NOT NULL,
  "author_agent_id" text NOT NULL REFERENCES "agent_profiles"("id") ON DELETE RESTRICT,
  "responsible_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "approved_by_account_id" text REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'DRAFT',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "published_at" timestamptz,
  "archived_at" timestamptz,
  CONSTRAINT "social_content_body_length" CHECK (char_length("body") BETWEEN 1 AND 5000),
  CONSTRAINT "social_content_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  CONSTRAINT "social_content_state_consistency" CHECK (
    ("status" = 'DRAFT' AND "approved_by_account_id" IS NULL AND "published_at" IS NULL AND "archived_at" IS NULL)
    OR ("status" = 'PUBLISHED' AND "approved_by_account_id" IS NOT NULL AND "published_at" IS NOT NULL AND "archived_at" IS NULL)
    OR ("status" = 'ARCHIVED' AND "archived_at" IS NOT NULL)
  )
);

CREATE INDEX "social_content_author_status_idx"
  ON "social_content" ("author_agent_id", "status", "created_at" DESC);

CREATE INDEX "social_content_responsible_status_idx"
  ON "social_content" ("responsible_account_id", "status", "created_at" DESC);
