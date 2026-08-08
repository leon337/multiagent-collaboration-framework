alter table "mcf_external_action_attempts"
  add column if not exists "idempotency_key" text;

alter table "mcf_external_action_attempts"
  add column if not exists "idempotency_fingerprint" text;

alter table "mcf_external_action_attempts"
  drop constraint if exists "mcf_external_action_attempts_mission_id_phase_id_key";

create index if not exists "mcf_external_action_attempts_idempotency_idx"
  on "mcf_external_action_attempts" (
    "mission_id",
    "skill_id",
    "adapter_id",
    "idempotency_key",
    "created_at"
  )
  where "idempotency_key" is not null;

create index if not exists "mcf_external_action_attempts_phase_idx"
  on "mcf_external_action_attempts" ("mission_id", "phase_id", "created_at");
