alter table "mcf_missions"
  add column if not exists "parent_mission_id" text references "mcf_missions"("id") on delete restrict,
  add column if not exists "return_to_agent_id" text,
  add column if not exists "return_status" text not null default 'NOT_APPLICABLE';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mcf_missions_return_status_check'
  ) then
    alter table "mcf_missions"
      add constraint "mcf_missions_return_status_check"
      check ("return_status" in ('NOT_APPLICABLE', 'PENDING', 'COMPLETED'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'mcf_missions_hierarchy_shape_check'
  ) then
    alter table "mcf_missions"
      add constraint "mcf_missions_hierarchy_shape_check"
      check (
        (
          "parent_mission_id" is null
          and "return_to_agent_id" is null
          and "return_status" = 'NOT_APPLICABLE'
        )
        or
        (
          "parent_mission_id" is not null
          and "return_to_agent_id" is not null
          and "return_status" in ('PENDING', 'COMPLETED')
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'mcf_missions_not_own_parent_check'
  ) then
    alter table "mcf_missions"
      add constraint "mcf_missions_not_own_parent_check"
      check ("parent_mission_id" is null or "parent_mission_id" <> "id");
  end if;
end $$;

create index if not exists "mcf_missions_parent_pending_idx"
  on "mcf_missions" ("parent_mission_id", "return_status", "state");

create or replace function "mcf_apply_mission_hierarchy"()
returns trigger
language plpgsql
as $$
declare
  parent_state text;
begin
  if tg_op = 'INSERT' then
    new."parent_mission_id" := nullif(new."contract" ->> 'parentMissionId', '');
    new."return_to_agent_id" := nullif(new."contract" ->> 'returnToAgentId', '');

    if new."parent_mission_id" is null then
      new."return_status" := 'NOT_APPLICABLE';
    else
      new."return_status" := 'PENDING';
    end if;
  end if;

  if new."parent_mission_id" is null then
    new."return_to_agent_id" := null;
    new."return_status" := 'NOT_APPLICABLE';
  else
    if new."parent_mission_id" = new."id" then
      raise exception 'MCF mission % cannot be its own parent', new."id"
        using errcode = '23514';
    end if;

    if new."return_to_agent_id" is null then
      raise exception 'MCF child mission % requires returnToAgentId', new."id"
        using errcode = '23514';
    end if;

    select "state"
      into parent_state
      from "mcf_missions"
      where "id" = new."parent_mission_id";

    if not found then
      raise exception 'MCF parent mission % does not exist', new."parent_mission_id"
        using errcode = '23503';
    end if;

    if parent_state in ('COMPLETED', 'CANCELLED') then
      raise exception 'MCF parent mission % is not active', new."parent_mission_id"
        using errcode = '23514';
    end if;

    if new."state" = 'COMPLETED' and new."return_status" = 'PENDING' then
      new."return_status" := 'COMPLETED';
    end if;
  end if;

  if new."state" = 'COMPLETED'
     and new."parent_mission_id" is null
     and exists (
       select 1
       from "mcf_missions" child
       where child."parent_mission_id" = new."id"
         and child."return_status" = 'PENDING'
         and child."state" <> 'CANCELLED'
     ) then
    new."state" := 'EXECUTING';
  end if;

  new."contract" := coalesce(new."contract", '{}'::jsonb)
    || jsonb_build_object(
      'parentMissionId', new."parent_mission_id",
      'returnToAgentId', new."return_to_agent_id",
      'returnStatus', new."return_status"
    );

  return new;
end;
$$;

drop trigger if exists "mcf_mission_hierarchy_before_write" on "mcf_missions";
create trigger "mcf_mission_hierarchy_before_write"
before insert or update on "mcf_missions"
for each row execute function "mcf_apply_mission_hierarchy"();

create or replace function "mcf_resume_parent_after_child_completion"()
returns trigger
language plpgsql
as $$
begin
  if new."parent_mission_id" is null
     or old."state" = 'COMPLETED'
     or new."state" <> 'COMPLETED'
     or new."return_status" <> 'COMPLETED' then
    return new;
  end if;

  update "mcf_missions"
    set "state" = 'EXECUTING',
        "current_agent_id" = new."return_to_agent_id",
        "version" = "version" + 1,
        "updated_at" = now()
    where "id" = new."parent_mission_id"
      and "state" not in ('COMPLETED', 'CANCELLED');

  if not found then
    raise exception 'MCF parent mission % could not be resumed', new."parent_mission_id"
      using errcode = '23514';
  end if;

  insert into "mcf_events" (
    "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
    "idempotency_key", "occurred_at"
  ) values (
    'hierarchy:return:' || new."id",
    new."id",
    new."current_phase_id",
    new."return_to_agent_id",
    'PARENT_RETURN_COMPLETED',
    jsonb_build_object(
      'parentMissionId', new."parent_mission_id",
      'returnToAgentId', new."return_to_agent_id"
    ),
    'hierarchy:return:' || new."id" || ':completed',
    now()
  ) on conflict ("idempotency_key") do nothing;

  insert into "mcf_events" (
    "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
    "idempotency_key", "occurred_at"
  ) values (
    'hierarchy:resume:' || new."parent_mission_id" || ':' || new."id",
    new."parent_mission_id",
    null,
    new."return_to_agent_id",
    'PARENT_MISSION_RESUMED',
    jsonb_build_object(
      'childMissionId', new."id",
      'returnToAgentId', new."return_to_agent_id"
    ),
    'hierarchy:parent:' || new."parent_mission_id" || ':resumed:' || new."id",
    now()
  ) on conflict ("idempotency_key") do nothing;

  return new;
end;
$$;

drop trigger if exists "mcf_resume_parent_after_child_completion" on "mcf_missions";
create trigger "mcf_resume_parent_after_child_completion"
after update on "mcf_missions"
for each row execute function "mcf_resume_parent_after_child_completion"();

create or replace function "mcf_guard_mission_completion_event"()
returns trigger
language plpgsql
as $$
declare
  persisted_state text;
begin
  if new."event_type" <> 'MISSION_COMPLETED' then
    return new;
  end if;

  select "state"
    into persisted_state
    from "mcf_missions"
    where "id" = new."mission_id";

  if persisted_state is distinct from 'COMPLETED' then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists "mcf_completion_event_requires_completed_mission" on "mcf_events";
create trigger "mcf_completion_event_requires_completed_mission"
before insert on "mcf_events"
for each row execute function "mcf_guard_mission_completion_event"();
