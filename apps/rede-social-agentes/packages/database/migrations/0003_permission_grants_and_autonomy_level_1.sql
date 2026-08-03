CREATE TABLE "permission_grants" (
  "id" text PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL REFERENCES "agent_profiles"("id") ON DELETE CASCADE,
  "granted_by_account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "permission_code" text NOT NULL,
  "scope" jsonb,
  "quota_limit" integer,
  "quota_used" integer NOT NULL DEFAULT 0,
  "valid_from" timestamptz NOT NULL DEFAULT now(),
  "valid_until" timestamptz,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "permission_grants_permission_check" CHECK (
    "permission_code" IN (
      'agent.profile.read',
      'agent.audit.read',
      'content.draft.create'
    )
  ),
  CONSTRAINT "permission_grants_scope_object" CHECK (
    "scope" IS NULL OR jsonb_typeof("scope") = 'object'
  ),
  CONSTRAINT "permission_grants_scope_shape" CHECK (
    "scope" IS NULL OR (
      jsonb_typeof("scope" -> 'resourceType') = 'string'
      AND jsonb_typeof("scope" -> 'resourceId') = 'string'
    )
  ),
  CONSTRAINT "permission_grants_quota_limit_positive" CHECK (
    "quota_limit" IS NULL OR "quota_limit" > 0
  ),
  CONSTRAINT "permission_grants_quota_used_nonnegative" CHECK ("quota_used" >= 0),
  CONSTRAINT "permission_grants_quota_consistency" CHECK (
    "quota_limit" IS NULL OR "quota_used" <= "quota_limit"
  ),
  CONSTRAINT "permission_grants_validity" CHECK (
    "valid_until" IS NULL OR "valid_until" > "valid_from"
  ),
  CONSTRAINT "permission_grants_status_check" CHECK (
    "status" IN ('ACTIVE', 'REVOKED')
  ),
  CONSTRAINT "permission_grants_revocation_consistency" CHECK (
    ("status" = 'ACTIVE' AND "revoked_at" IS NULL)
    OR ("status" = 'REVOKED' AND "revoked_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "permission_grants_one_active_global"
  ON "permission_grants" ("agent_id", "permission_code")
  WHERE "status" = 'ACTIVE' AND "scope" IS NULL;

CREATE UNIQUE INDEX "permission_grants_one_active_scoped"
  ON "permission_grants" (
    "agent_id",
    "permission_code",
    ("scope" ->> 'resourceType'),
    ("scope" ->> 'resourceId')
  )
  WHERE "status" = 'ACTIVE' AND "scope" IS NOT NULL;

CREATE INDEX "permission_grants_agent_lookup"
  ON "permission_grants" ("agent_id", "permission_code", "status");

CREATE INDEX "permission_grants_responsible_lookup"
  ON "permission_grants" ("granted_by_account_id", "status");
