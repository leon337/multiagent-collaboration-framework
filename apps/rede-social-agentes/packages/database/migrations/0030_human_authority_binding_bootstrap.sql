CREATE TABLE "human_authority_binding_intents" (
  "intent_ref" uuid PRIMARY KEY,
  "target" text NOT NULL,
  "state" text NOT NULL,
  "subject_fingerprint" text NOT NULL,
  "sealed_binding" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "claim_ref" uuid,
  "claim_expires_at" timestamptz,
  "principal_fingerprint" text,
  "provider_mutation_digest" text,
  "receipt_digest" text,
  "failure_code" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  CONSTRAINT "human_authority_binding_target_check" CHECK ("target" IN ('STAGING')),
  CONSTRAINT "human_authority_binding_state_check" CHECK (
    "state" IN ('PENDING', 'APPLYING', 'VERIFYING', 'BOUND', 'CONFLICT', 'FAILED')
  ),
  CONSTRAINT "human_authority_binding_subject_fingerprint_check" CHECK (
    "subject_fingerprint" ~ '^[a-f0-9]{64}$'
  )
);

CREATE UNIQUE INDEX "human_authority_binding_active_target_uq"
  ON "human_authority_binding_intents" ("target")
  WHERE "state" IN ('PENDING', 'APPLYING', 'VERIFYING');

CREATE INDEX "human_authority_binding_state_idx"
  ON "human_authority_binding_intents" ("state", "updated_at");
