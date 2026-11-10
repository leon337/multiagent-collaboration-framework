-- MCF-AUTONOMY-001 / Issue #508.
-- Observational continuation only: no human authority, production grants or
-- external actions are stored or implied by this table.
CREATE TABLE "mcf_mission_continuations" (
  "id" uuid PRIMARY KEY,
  "dedupe_key" char(64) NOT NULL UNIQUE,
  "kind" text NOT NULL DEFAULT 'RELEASE_OBSERVATION',
  "goal" text NOT NULL,
  "release_sha" char(40) NOT NULL,
  "target_binding_id" text NOT NULL,
  "state" text NOT NULL DEFAULT 'DISCOVERING',
  "version" integer NOT NULL DEFAULT 1,
  "progress_fingerprint" char(64),
  "blockers" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "evidence_digest" char(64),
  "notification_count" integer NOT NULL DEFAULT 0,
  "gate_request_count" integer NOT NULL DEFAULT 0,
  "observed_at" timestamptz,
  "changed_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "mcf_continuation_kind_check"
    CHECK ("kind" = 'RELEASE_OBSERVATION'),
  CONSTRAINT "mcf_continuation_sha_check"
    CHECK ("release_sha" ~ '^[a-f0-9]{40}$'),
  CONSTRAINT "mcf_continuation_dedupe_check"
    CHECK ("dedupe_key" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "mcf_continuation_fingerprint_check"
    CHECK ("progress_fingerprint" IS NULL OR "progress_fingerprint" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "mcf_continuation_evidence_check"
    CHECK ("evidence_digest" IS NULL OR "evidence_digest" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "mcf_continuation_target_check"
    CHECK ("target_binding_id" ~ '^[A-Za-z0-9._:-]{3,100}$'),
  CONSTRAINT "mcf_continuation_state_check"
    CHECK ("state" IN ('DISCOVERING','BLOCKED_EXTERNAL','WAITING_CANONICAL_GATE',
                       'SUPERSEDED','CANCELLED')),
  CONSTRAINT "mcf_continuation_counts_check"
    CHECK ("notification_count" >= 0 AND "gate_request_count" = 0 AND "version" > 0),
  CONSTRAINT "mcf_continuation_blockers_check"
    CHECK (jsonb_typeof("blockers") = 'array')
);

CREATE INDEX "mcf_mission_continuations_state_idx"
  ON "mcf_mission_continuations" ("state", "changed_at");


-- Fingerprint history is a derived observation ledger, never an authority
-- grant. Replayed A -> B -> A cannot emit A twice.
CREATE TABLE "mcf_mission_continuation_fingerprints" (
  "continuation_id" uuid NOT NULL REFERENCES "mcf_mission_continuations"("id") ON DELETE CASCADE,
  "fingerprint" char(64) NOT NULL CHECK ("fingerprint" ~ '^[a-f0-9]{64}$'),
  "first_seen_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("continuation_id", "fingerprint")
);
