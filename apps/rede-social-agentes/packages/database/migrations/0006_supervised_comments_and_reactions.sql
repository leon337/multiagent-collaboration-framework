ALTER TABLE "permission_grants"
  DROP CONSTRAINT "permission_grants_permission_check";

ALTER TABLE "permission_grants"
  ADD CONSTRAINT "permission_grants_permission_check" CHECK (
    "permission_code" IN (
      'agent.profile.read',
      'agent.audit.read',
      'content.draft.create',
      'content.comment.draft.create'
    )
  );

CREATE TABLE "social_comments" (
  "id" text PRIMARY KEY NOT NULL,
  "content_id" text NOT NULL REFERENCES "social_content"("id") ON DELETE CASCADE,
  "author_type" text NOT NULL,
  "author_account_id" text REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "author_agent_id" text REFERENCES "agent_profiles"("id") ON DELETE RESTRICT,
  "responsible_account_id" text REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "approved_by_account_id" text REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "body" text NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "published_at" timestamptz,
  "archived_at" timestamptz,
  CONSTRAINT "social_comments_author_type_check" CHECK ("author_type" IN ('HUMAN', 'AGENT')),
  CONSTRAINT "social_comments_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  CONSTRAINT "social_comments_body_length" CHECK (char_length("body") BETWEEN 1 AND 2000),
  CONSTRAINT "social_comments_author_shape" CHECK (
    (
      "author_type" = 'HUMAN'
      AND "author_account_id" IS NOT NULL
      AND "author_agent_id" IS NULL
      AND "responsible_account_id" IS NULL
    )
    OR (
      "author_type" = 'AGENT'
      AND "author_account_id" IS NULL
      AND "author_agent_id" IS NOT NULL
      AND "responsible_account_id" IS NOT NULL
    )
  ),
  CONSTRAINT "social_comments_state_consistency" CHECK (
    (
      "status" = 'DRAFT'
      AND "author_type" = 'AGENT'
      AND "approved_by_account_id" IS NULL
      AND "published_at" IS NULL
      AND "archived_at" IS NULL
    )
    OR (
      "status" = 'PUBLISHED'
      AND "approved_by_account_id" IS NOT NULL
      AND "published_at" IS NOT NULL
      AND "archived_at" IS NULL
    )
    OR (
      "status" = 'ARCHIVED'
      AND "archived_at" IS NOT NULL
    )
  )
);

CREATE INDEX "social_comments_content_published_idx"
  ON "social_comments" ("content_id", "published_at" ASC, "id" ASC)
  WHERE "status" = 'PUBLISHED';

CREATE INDEX "social_comments_agent_status_idx"
  ON "social_comments" ("author_agent_id", "status", "created_at" DESC)
  WHERE "author_agent_id" IS NOT NULL;

CREATE TABLE "social_reactions" (
  "content_id" text NOT NULL REFERENCES "social_content"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "reaction_type" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("content_id", "account_id", "reaction_type"),
  CONSTRAINT "social_reactions_type_check" CHECK (
    "reaction_type" IN ('LIKE', 'INSIGHTFUL', 'SUPPORT')
  )
);

CREATE INDEX "social_reactions_content_idx"
  ON "social_reactions" ("content_id", "reaction_type");
