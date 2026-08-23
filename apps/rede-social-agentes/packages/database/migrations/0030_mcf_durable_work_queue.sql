create table if not exists "mcf_work_jobs" (
  "id" text primary key,
  "dispatch_id" text not null unique,
  "spec_digest" text not null check ("spec_digest" ~ '^[a-f0-9]{64}$'),
  "mission_id" text references "mcf_missions"("id") on delete set null,
  "phase_id" text references "mcf_phases"("id") on delete set null,
  "agent_id" text,
  "repository_key" text not null,
  "base_ref" text not null,
  "base_sha" text not null check ("base_sha" ~ '^[a-f0-9]{40}([a-f0-9]{24})?$'),
  "risk_class" text not null check ("risk_class" in ('A', 'B', 'C')),
  "gate_required" boolean not null default false,
  "priority" integer not null default 0 check ("priority" between -100 and 100),
  "spec" jsonb not null check (jsonb_typeof("spec") = 'object'),
  "status" text not null check (
    "status" in (
      'WAITING_GATE',
      'QUEUED',
      'RUNNING',
      'RETRY_WAIT',
      'BLOCKED_AUTH',
      'BLOCKED_POLICY',
      'SUCCEEDED',
      'FAILED',
      'DEAD',
      'CANCELLED'
    )
  ),
  "attempt_count" integer not null default 0 check ("attempt_count" >= 0),
  "max_attempts" integer not null default 3 check ("max_attempts" between 1 and 10),
  "next_attempt_at" timestamptz not null default now(),
  "lease_owner" text,
  "lease_token" text,
  "lease_expires_at" timestamptz,
  "heartbeat_at" timestamptz,
  "cancellation_requested" boolean not null default false,
  "result" jsonb check ("result" is null or jsonb_typeof("result") = 'object'),
  "failure" jsonb check ("failure" is null or jsonb_typeof("failure") = 'object'),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "finished_at" timestamptz,
  check ("attempt_count" <= "max_attempts"),
  check (
    ("status" = 'RUNNING' and "lease_owner" is not null and "lease_token" is not null and "lease_expires_at" is not null and "heartbeat_at" is not null)
    or
    ("status" <> 'RUNNING' and "lease_owner" is null and "lease_token" is null and "lease_expires_at" is null and "heartbeat_at" is null)
  ),
  check (
    ("status" in ('SUCCEEDED', 'FAILED', 'DEAD', 'CANCELLED') and "finished_at" is not null)
    or
    ("status" not in ('SUCCEEDED', 'FAILED', 'DEAD', 'CANCELLED') and "finished_at" is null)
  ),
  check ("status" <> 'SUCCEEDED' or "result" is not null),
  check ("status" not in ('BLOCKED_AUTH', 'BLOCKED_POLICY', 'FAILED', 'DEAD') or "failure" is not null),
  check ("risk_class" <> 'C' or "gate_required")
);

create table if not exists "mcf_work_attempts" (
  "id" text primary key,
  "job_id" text not null references "mcf_work_jobs"("id") on delete cascade,
  "attempt_number" integer not null check ("attempt_number" > 0),
  "worker_id" text not null,
  "lease_token" text not null,
  "status" text not null check ("status" in ('RUNNING', 'SUCCEEDED', 'FAILED', 'ABANDONED', 'CANCELLED')),
  "result" jsonb check ("result" is null or jsonb_typeof("result") = 'object'),
  "failure" jsonb check ("failure" is null or jsonb_typeof("failure") = 'object'),
  "started_at" timestamptz not null,
  "heartbeat_at" timestamptz not null,
  "finished_at" timestamptz,
  unique ("job_id", "attempt_number"),
  check (
    ("status" = 'RUNNING' and "finished_at" is null)
    or
    ("status" <> 'RUNNING' and "finished_at" is not null)
  )
);

create unique index if not exists "mcf_work_attempts_one_running_per_job_idx"
  on "mcf_work_attempts" ("job_id")
  where "status" = 'RUNNING';

create table if not exists "mcf_work_gates" (
  "id" text primary key,
  "job_id" text not null references "mcf_work_jobs"("id") on delete cascade,
  "spec_digest" text not null check ("spec_digest" ~ '^[a-f0-9]{64}$'),
  "state" text not null check ("state" in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  "decided_by" text,
  "reason" text,
  "decided_at" timestamptz,
  "expires_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  unique ("job_id", "spec_digest"),
  check (
    ("state" = 'PENDING' and "decided_by" is null and "reason" is null and "decided_at" is null)
    or
    ("state" <> 'PENDING' and "decided_by" is not null and "reason" is not null and "decided_at" is not null)
  )
);

create table if not exists "mcf_work_events" (
  "id" text primary key,
  "sequence" bigint generated always as identity unique,
  "job_id" text not null references "mcf_work_jobs"("id") on delete cascade,
  "attempt_id" text references "mcf_work_attempts"("id") on delete set null,
  "event_type" text not null,
  "payload" jsonb not null check (jsonb_typeof("payload") = 'object'),
  "idempotency_key" text not null unique,
  "occurred_at" timestamptz not null default now()
);

create index if not exists "mcf_work_jobs_claimable_idx"
  on "mcf_work_jobs" ("priority" desc, "next_attempt_at", "created_at")
  where "status" in ('QUEUED', 'RETRY_WAIT');

create index if not exists "mcf_work_jobs_lease_idx"
  on "mcf_work_jobs" ("lease_expires_at")
  where "status" = 'RUNNING';

create index if not exists "mcf_work_jobs_mission_idx"
  on "mcf_work_jobs" ("mission_id", "created_at")
  where "mission_id" is not null;

create index if not exists "mcf_work_attempts_job_idx"
  on "mcf_work_attempts" ("job_id", "attempt_number");

create index if not exists "mcf_work_gates_job_idx"
  on "mcf_work_gates" ("job_id", "state", "expires_at");

create index if not exists "mcf_work_events_job_idx"
  on "mcf_work_events" ("job_id", "sequence");
