CREATE TABLE "communities" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "owner_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "archived_at" timestamptz,
  CONSTRAINT "communities_slug_shape" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT "communities_slug_length" CHECK (char_length("slug") BETWEEN 3 AND 64),
  CONSTRAINT "communities_name_length" CHECK (char_length("name") BETWEEN 1 AND 120),
  CONSTRAINT "communities_description_length" CHECK (
    "description" IS NULL OR char_length("description") <= 1000
  ),
  CONSTRAINT "communities_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED')),
  CONSTRAINT "communities_archive_consistency" CHECK (
    ("status" = 'ACTIVE' AND "archived_at" IS NULL)
    OR ("status" = 'ARCHIVED' AND "archived_at" IS NOT NULL)
  )
);

CREATE TABLE "community_members" (
  "id" text PRIMARY KEY NOT NULL,
  "community_id" text NOT NULL REFERENCES "communities"("id") ON DELETE CASCADE,
  "subject_type" text NOT NULL,
  "account_id" text REFERENCES "accounts"("id") ON DELETE CASCADE,
  "agent_id" text REFERENCES "agent_profiles"("id") ON DELETE CASCADE,
  "responsible_account_id" text REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "role" text NOT NULL DEFAULT 'MEMBER',
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  "ended_at" timestamptz,
  CONSTRAINT "community_members_subject_type_check" CHECK (
    "subject_type" IN ('HUMAN', 'AGENT')
  ),
  CONSTRAINT "community_members_role_check" CHECK ("role" IN ('OWNER', 'MEMBER')),
  CONSTRAINT "community_members_status_check" CHECK ("status" IN ('ACTIVE', 'ENDED')),
  CONSTRAINT "community_members_subject_shape" CHECK (
    (
      "subject_type" = 'HUMAN'
      AND "account_id" IS NOT NULL
      AND "agent_id" IS NULL
      AND "responsible_account_id" IS NULL
    )
    OR (
      "subject_type" = 'AGENT'
      AND "account_id" IS NULL
      AND "agent_id" IS NOT NULL
      AND "responsible_account_id" IS NOT NULL
      AND "role" = 'MEMBER'
    )
  ),
  CONSTRAINT "community_members_end_consistency" CHECK (
    ("status" = 'ACTIVE' AND "ended_at" IS NULL)
    OR ("status" = 'ENDED' AND "ended_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "community_members_active_human_unique"
  ON "community_members" ("community_id", "account_id")
  WHERE "status" = 'ACTIVE' AND "subject_type" = 'HUMAN';

CREATE UNIQUE INDEX "community_members_active_agent_unique"
  ON "community_members" ("community_id", "agent_id")
  WHERE "status" = 'ACTIVE' AND "subject_type" = 'AGENT';

CREATE UNIQUE INDEX "community_members_one_active_owner"
  ON "community_members" ("community_id")
  WHERE "status" = 'ACTIVE' AND "role" = 'OWNER';

CREATE INDEX "community_members_active_listing"
  ON "community_members" ("community_id", "joined_at" ASC, "id" ASC)
  WHERE "status" = 'ACTIVE';

ALTER TABLE "social_content"
  ADD COLUMN "community_id" text REFERENCES "communities"("id") ON DELETE RESTRICT;

CREATE INDEX "social_content_community_feed_idx"
  ON "social_content" ("community_id", "published_at" DESC, "id" DESC)
  WHERE "status" = 'PUBLISHED' AND "community_id" IS NOT NULL;
