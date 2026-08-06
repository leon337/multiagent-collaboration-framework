drop trigger if exists "mcf_mirror_external_action_events" on "mcf_events";
drop function if exists "mcf_mirror_external_action_events"();

create table if not exists "mcf_external_action_attempts" (
  "attempt_id" text primary key,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "phase_id" text not null,
  "agent_id" text not null,
  "skill_id" text not null,
  "adapter_id" text not null,
  "provider" text not null,
  "operation" text not null,
  "resource" text not null,
  "expected_mission_version" integer not null check ("expected_mission_version" > 0),
  "status" text not null check (
    "status" in (
      'ALLOWED',
      'EXECUTED',
      'FAILED',
      'EVIDENCE_VALIDATED',
      'EVIDENCE_REJECTED'
    )
  ),
  "receipt_id" text,
  "failure_code" text,
  "failure_message" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  unique ("mission_id", "phase_id")
);

create index if not exists "mcf_external_action_attempts_mission_idx"
  on "mcf_external_action_attempts" ("mission_id", "created_at");

create index if not exists "mcf_external_action_attempts_status_idx"
  on "mcf_external_action_attempts" ("status", "updated_at");

alter table "mcf_missions"
  add column if not exists "active_external_attempt_id" text;

create unique index if not exists "mcf_missions_active_external_attempt_idx"
  on "mcf_missions" ("active_external_attempt_id")
  where "active_external_attempt_id" is not null;
