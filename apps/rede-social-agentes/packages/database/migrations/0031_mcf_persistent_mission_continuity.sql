create table if not exists "mcf_mission_continuity" (
  "mission_id" text primary key references "mcf_missions"("id") on delete cascade,
  "dispatch_id" text not null unique,
  "spec_digest" text not null check ("spec_digest" ~ '^[a-f0-9]{64}$'),
  "project_key" text not null,
  "repository_key" text not null,
  "priority" integer not null default 0 check ("priority" between -100 and 100),
  "spec" jsonb not null check (jsonb_typeof("spec") = 'object'),
  "status" text not null check (
    "status" in (
      'QUEUED',
      'RUNNING',
      'RETRY_WAIT',
      'WAITING_GATE',
      'BLOCKED_AUTH',
      'BLOCKED_POLICY',
      'SUCCEEDED',
      'FAILED',
      'CANCELLED'
    )
  ),
  "fencing_token" integer not null default 0 check ("fencing_token" >= 0),
  "current_step_key" text,
  "completed_step_count" integer not null default 0 check ("completed_step_count" >= 0),
  "total_step_count" integer not null check ("total_step_count" > 0),
  "worktree_path" text,
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
  check ("completed_step_count" <= "total_step_count"),
  check (
    ("status" = 'RUNNING'
      and "lease_owner" is not null
      and "lease_token" is not null
      and "lease_expires_at" is not null
      and "heartbeat_at" is not null)
    or
    ("status" <> 'RUNNING'
      and "lease_owner" is null
      and "lease_token" is null
      and "lease_expires_at" is null
      and "heartbeat_at" is null)
  ),
  check (
    ("status" in ('SUCCEEDED', 'FAILED', 'CANCELLED') and "finished_at" is not null)
    or
    ("status" not in ('SUCCEEDED', 'FAILED', 'CANCELLED') and "finished_at" is null)
  ),
  check ("status" <> 'SUCCEEDED' or "completed_step_count" = "total_step_count"),
  check ("status" not in ('BLOCKED_AUTH', 'BLOCKED_POLICY', 'FAILED') or "failure" is not null)
);

alter table "mcf_work_jobs"
  add column if not exists "step_key" text,
  add column if not exists "step_order" integer,
  add column if not exists "depends_on_step_keys" jsonb,
  add column if not exists "state_version" integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mcf_work_jobs_continuity_step_shape_check'
  ) then
    alter table "mcf_work_jobs"
      add constraint "mcf_work_jobs_continuity_step_shape_check"
      check (
        ("step_key" is null and "step_order" is null and "depends_on_step_keys" is null)
        or
        ("mission_id" is not null
          and "step_key" is not null
          and "step_order" is not null
          and "step_order" > 0
          and "depends_on_step_keys" is not null
          and jsonb_typeof("depends_on_step_keys") = 'array')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'mcf_work_jobs_state_version_check'
  ) then
    alter table "mcf_work_jobs"
      add constraint "mcf_work_jobs_state_version_check" check ("state_version" > 0);
  end if;
end $$;

create unique index if not exists "mcf_work_jobs_mission_step_key_idx"
  on "mcf_work_jobs" ("mission_id", "step_key")
  where "step_key" is not null;

create unique index if not exists "mcf_work_jobs_mission_step_order_idx"
  on "mcf_work_jobs" ("mission_id", "step_order")
  where "step_order" is not null;

create index if not exists "mcf_work_jobs_runnable_mission_step_idx"
  on "mcf_work_jobs" ("mission_id", "step_order")
  where "step_key" is not null and "status" in ('QUEUED', 'RETRY_WAIT');

alter table "mcf_work_events"
  add column if not exists "mission_id" text references "mcf_missions"("id") on delete cascade;

alter table "mcf_work_events" alter column "job_id" drop not null;

update "mcf_work_events" event
set "mission_id" = job."mission_id"
from "mcf_work_jobs" job
where event."job_id" = job."id" and event."mission_id" is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mcf_work_events_owner_check'
  ) then
    alter table "mcf_work_events"
      add constraint "mcf_work_events_owner_check"
      check ("mission_id" is not null or "job_id" is not null);
  end if;
end $$;

create or replace function "mcf_bind_work_event_mission"()
returns trigger
language plpgsql
as $$
declare
  persisted_mission_id text;
begin
  if new."job_id" is not null then
    select "mission_id" into persisted_mission_id
      from "mcf_work_jobs"
      where "id" = new."job_id";

    if not found then
      raise exception 'MCF work event job % does not exist', new."job_id"
        using errcode = '23503';
    end if;

    if new."mission_id" is null then
      new."mission_id" := persisted_mission_id;
    elsif persisted_mission_id is not null and new."mission_id" <> persisted_mission_id then
      raise exception 'MCF work event mission does not own job %', new."job_id"
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists "mcf_bind_work_event_mission" on "mcf_work_events";
create trigger "mcf_bind_work_event_mission"
before insert or update of "mission_id", "job_id" on "mcf_work_events"
for each row execute function "mcf_bind_work_event_mission"();

create table if not exists "mcf_mission_checkpoints" (
  "id" text primary key,
  "sequence" bigint generated always as identity unique,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "job_id" text not null references "mcf_work_jobs"("id") on delete cascade,
  "step_key" text not null,
  "attempt_number" integer not null check ("attempt_number" > 0),
  "checkpoint_key" text not null,
  "state_version" integer not null check ("state_version" > 0),
  "fencing_token" integer not null check ("fencing_token" > 0),
  "checkpoint" jsonb not null check (jsonb_typeof("checkpoint") = 'object'),
  "result" jsonb not null check (jsonb_typeof("result") = 'object'),
  "created_at" timestamptz not null default now(),
  unique ("mission_id", "checkpoint_key")
);

create table if not exists "mcf_mission_artifacts" (
  "id" text primary key,
  "mission_id" text not null references "mcf_missions"("id") on delete cascade,
  "job_id" text references "mcf_work_jobs"("id") on delete cascade,
  "checkpoint_id" text references "mcf_mission_checkpoints"("id") on delete cascade,
  "artifact_key" text not null,
  "kind" text not null,
  "relative_path" text not null,
  "sha256" text not null check ("sha256" ~ '^[a-f0-9]{64}$'),
  "size_bytes" bigint not null check ("size_bytes" >= 0),
  "media_type" text not null,
  "metadata" jsonb not null default '{}'::jsonb check (jsonb_typeof("metadata") = 'object'),
  "created_at" timestamptz not null default now(),
  unique ("mission_id", "artifact_key")
);

create index if not exists "mcf_mission_continuity_active_idx"
  on "mcf_mission_continuity" ("project_key", "repository_key", "updated_at" desc)
  where "status" not in ('SUCCEEDED', 'FAILED', 'CANCELLED');

create index if not exists "mcf_mission_continuity_claim_idx"
  on "mcf_mission_continuity" ("priority" desc, "created_at", "mission_id")
  where "status" in ('QUEUED', 'RETRY_WAIT');

create index if not exists "mcf_mission_continuity_lease_idx"
  on "mcf_mission_continuity" ("lease_expires_at")
  where "status" = 'RUNNING';

create index if not exists "mcf_work_events_mission_idx"
  on "mcf_work_events" ("mission_id", "sequence")
  where "mission_id" is not null;

create index if not exists "mcf_mission_checkpoints_mission_idx"
  on "mcf_mission_checkpoints" ("mission_id", "sequence");

create index if not exists "mcf_mission_artifacts_mission_idx"
  on "mcf_mission_artifacts" ("mission_id", "created_at", "id");
