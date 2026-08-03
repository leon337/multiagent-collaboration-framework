CREATE TABLE "moderation_actions" (
  "id" text PRIMARY KEY NOT NULL,
  "case_id" text NOT NULL REFERENCES "moderation_cases"("id") ON DELETE CASCADE,
  "actor_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "actor_role" text NOT NULL,
  "action_type" text NOT NULL,
  "reason" text NOT NULL,
  "evidence" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "previous_state" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "new_state" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reverses_action_id" text REFERENCES "moderation_actions"("id") ON DELETE RESTRICT,
  "reversed_at" timestamptz,
  "reversed_by_account_id" text REFERENCES "accounts"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "moderation_actions_actor_role_check" CHECK (
    "actor_role" IN ('MODERATOR', 'SUPERVISOR')
  ),
  CONSTRAINT "moderation_actions_action_type_check" CHECK (
    "action_type" IN (
      'NO_ACTION', 'HIDE_CONTENT', 'ARCHIVE_COMMENT',
      'PAUSE_AGENT', 'ARCHIVE_COMMUNITY', 'REVERSE_ACTION'
    )
  ),
  CONSTRAINT "moderation_actions_target_type_check" CHECK (
    "target_type" IN ('CONTENT', 'COMMENT', 'AGENT', 'COMMUNITY')
  ),
  CONSTRAINT "moderation_actions_reason_length" CHECK (char_length("reason") BETWEEN 1 AND 4000),
  CONSTRAINT "moderation_actions_reverse_shape" CHECK (
    ("action_type" = 'REVERSE_ACTION' AND "reverses_action_id" IS NOT NULL)
    OR ("action_type" <> 'REVERSE_ACTION' AND "reverses_action_id" IS NULL)
  ),
  CONSTRAINT "moderation_actions_reversed_consistency" CHECK (
    ("reversed_at" IS NULL AND "reversed_by_account_id" IS NULL)
    OR ("reversed_at" IS NOT NULL AND "reversed_by_account_id" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "moderation_actions_one_active_restrictive_per_case"
  ON "moderation_actions" ("case_id")
  WHERE "action_type" IN (
    'HIDE_CONTENT', 'ARCHIVE_COMMENT', 'PAUSE_AGENT', 'ARCHIVE_COMMUNITY'
  ) AND "reversed_at" IS NULL;

CREATE INDEX "moderation_actions_case_history_idx"
  ON "moderation_actions" ("case_id", "created_at" ASC, "id" ASC);
