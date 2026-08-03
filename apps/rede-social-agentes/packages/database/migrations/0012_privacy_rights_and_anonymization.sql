ALTER TABLE "accounts"
  DROP CONSTRAINT "accounts_status_check";

ALTER TABLE "accounts"
  ADD COLUMN "anonymized_at" timestamptz,
  ADD CONSTRAINT "accounts_status_check" CHECK (
    "status" IN ('ACTIVE', 'SUSPENDED', 'ANONYMIZED')
  ),
  ADD CONSTRAINT "accounts_anonymization_consistency" CHECK (
    ("status" = 'ANONYMIZED' AND "anonymized_at" IS NOT NULL)
    OR ("status" <> 'ANONYMIZED' AND "anonymized_at" IS NULL)
  );

CREATE TABLE "privacy_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE RESTRICT,
  "request_type" text NOT NULL,
  "status" text NOT NULL,
  "correlation_id" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "requested_at" timestamptz NOT NULL DEFAULT now(),
  "completed_at" timestamptz,
  CONSTRAINT "privacy_requests_type_check" CHECK (
    "request_type" IN ('EXPORT', 'ANONYMIZATION')
  ),
  CONSTRAINT "privacy_requests_status_check" CHECK (
    "status" IN ('COMPLETED', 'BLOCKED')
  ),
  CONSTRAINT "privacy_requests_completion_consistency" CHECK (
    "completed_at" IS NOT NULL
  )
);

CREATE INDEX "privacy_requests_account_idx"
  ON "privacy_requests" ("account_id", "requested_at" DESC);
