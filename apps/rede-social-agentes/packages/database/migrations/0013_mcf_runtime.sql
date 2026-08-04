create table if not exists "mcf_missions" (
  "id" text primary key,
  "contract" jsonb not null,
  "state" text not null check (
    "state" in (
      'PLANNED',
      'EXECUTING',
      'RECOVERING',
      'WAITING_EXTERNAL',
      'BLOCKED_RISK',
      'COMPLETED',
      'CANCELLED'
    )
  ),
  "current_phase_id" text,
  "current_agent_id" text,
  "version" integer not null default 1 check ("version" > 0),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "mcf_phases" (
  "id" text primary key,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "skill_id" text not null,
  "agent_id" text not null,
  "state" text not null check (
    "state" in (
      'PLANNED',
      'EXECUTING',
      'WAITING_EVIDENCE',
      'RECOVERING',
      'FAILED',
      'COMPLETED'
    )
  ),
  "cycle" integer not null default 1 check ("cycle" > 0),
  "inputs" jsonb not null,
  "expected_evidence" jsonb not null,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "mcf_tool_receipts" (
  "receipt_id" text primary key,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "phase_id" text not null references "mcf_phases"("id") on delete cascade,
  "provider" text not null,
  "operation" text not null,
  "resource" text not null,
  "external_id" text,
  "commit_sha" text,
  "status" text not null check ("status" in ('SUCCEEDED', 'FAILED', 'PARTIAL')),
  "observed_at" timestamptz not null,
  "payload_digest" text not null,
  "signature" text not null,
  "metadata" jsonb not null,
  "validation_status" text not null check ("validation_status" in ('VALID', 'INVALID', 'PENDING')),
  "created_at" timestamptz not null default now()
);

create table if not exists "mcf_handoffs" (
  "id" text primary key,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "phase_id" text not null references "mcf_phases"("id") on delete cascade,
  "from_agent_id" text not null,
  "to_agent_id" text not null,
  "objective_state" jsonb not null,
  "delivered" jsonb not null,
  "evidence_receipt_ids" jsonb not null,
  "open_findings" jsonb not null,
  "next_action" text not null,
  "acceptance_for_next_action" text not null,
  "created_at" timestamptz not null default now(),
  check ("from_agent_id" <> "to_agent_id")
);

create table if not exists "mcf_events" (
  "id" text primary key,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "phase_id" text,
  "agent_id" text,
  "event_type" text not null,
  "payload" jsonb not null,
  "idempotency_key" text not null unique,
  "occurred_at" timestamptz not null default now()
);

create index if not exists "mcf_phases_mission_idx" on "mcf_phases" ("mission_id", "created_at");
create index if not exists "mcf_receipts_mission_phase_idx" on "mcf_tool_receipts" ("mission_id", "phase_id");
create index if not exists "mcf_handoffs_mission_idx" on "mcf_handoffs" ("mission_id", "created_at");
create index if not exists "mcf_events_mission_idx" on "mcf_events" ("mission_id", "occurred_at");
create index if not exists "mcf_events_phase_idx" on "mcf_events" ("phase_id", "occurred_at");
