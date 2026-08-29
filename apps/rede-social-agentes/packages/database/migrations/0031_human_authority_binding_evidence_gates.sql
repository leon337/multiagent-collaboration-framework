ALTER TABLE "human_authority_binding_intents"
  DROP CONSTRAINT "human_authority_binding_state_check";

ALTER TABLE "human_authority_binding_intents"
  ADD COLUMN "runtime_evidence_digest" text,
  ADD COLUMN "behavior_evidence_digest" text,
  ADD COLUMN "reconciliation_digest" text;

ALTER TABLE "human_authority_binding_intents"
  ADD CONSTRAINT "human_authority_binding_state_check" CHECK (
    "state" IN (
      'PENDING', 'APPLYING', 'PROVIDER_APPLIED', 'VERIFYING', 'RUNTIME_VERIFIED',
      'RECONCILIATION_REQUIRED', 'BOUND', 'CONFLICT', 'FAILED'
    )
  );

DROP INDEX "human_authority_binding_active_target_uq";
CREATE UNIQUE INDEX "human_authority_binding_active_target_uq"
  ON "human_authority_binding_intents" ("target")
  WHERE "state" IN (
    'PENDING', 'APPLYING', 'PROVIDER_APPLIED', 'VERIFYING',
    'RUNTIME_VERIFIED', 'RECONCILIATION_REQUIRED'
  );
