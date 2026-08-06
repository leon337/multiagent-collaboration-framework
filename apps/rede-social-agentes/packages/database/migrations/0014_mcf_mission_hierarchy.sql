alter table "mcf_missions"
  add column if not exists "parent_mission_id" text references "mcf_missions"("id") on delete restrict,
  add column if not exists "return_to_agent_id" text,
  add column if not exists "return_status" text not null default 'NOT_APPLICABLE',
  add column if not exists "parent_checkpoint_state" text,
  add column if not exists "parent_checkpoint_phase_id" text,
  add column if not exists "parent_checkpoint_agent_id" text;

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
    select 1 from pg_constraint where conname = 'mcf_missions_parent_checkpoint_state_check'
  ) then
    alter table "mcf_missions"
      add constraint "mcf_missions_parent_checkpoint_state_check"
      check (
        "parent_checkpoint_state" is null
        or "parent_checkpoint_state" in (
          'PLANNED',
          'EXECUTING',
          'RECOVERING',
          'WAITING_EXTERNAL',
          'BLOCKED_RISK',
          'COMPLETED',
          'CANCELLED'
        )
      );
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
          and "parent_checkpoint_state" is null
          and "parent_checkpoint_phase_id" is null
          and "parent_checkpoint_agent_id" is null
        )
        or
        (
          "parent_mission_id" is not null
          and "return_to_agent_id" is not null
          and "return_status" in ('PENDING', 'COMPLETED')
          and "parent_checkpoint_state" is not null
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
  parent_phase_id text;
  parent_agent_id text;
begin
  if tg_op = 'INSERT' then
    new."parent_mission_id" := nullif(new."contract" ->> 'parentMissionId', '');
    new."return_to_agent_id" := nullif(new."contract" ->> 'returnToAgentId', '');

    if new."parent_mission_id" is null then
      new."return_status" := 'NOT_APPLICABLE';
      new."parent_checkpoint_state" := null;
      new."parent_checkpoint_phase_id" := null;
      new."parent_checkpoint_agent_id" := null;
    else
      if new."parent_mission_id" = new."id" then
        raise exception 'MCF mission % cannot be its own parent', new."id"
          using errcode = '23514';
      end if;

      if new."return_to_agent_id" is null then
        raise exception 'MCF child mission % requires returnToAgentId', new."id"
          using errcode = '23514';
      end if;

      select "state", "current_phase_id", "current_agent_id"
        into parent_state, parent_phase_id, parent_agent_id
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

      new."return_status" := 'PENDING';
      new."parent_checkpoint_state" := parent_state;
      new."parent_checkpoint_phase_id" := parent_phase_id;
      new."parent_checkpoint_agent_id" := parent_agent_id;
    end if;
  end if;

  if new."parent_mission_id" is null then
    new."return_to_agent_id" := null;
    new."return_status" := 'NOT_APPLICABLE';
    new."parent_checkpoint_state" := null;
    new."parent_checkpoint_phase_id" := null;
    new."parent_checkpoint_agent_id" := null;
  else
    if new."parent_mission_id" = new."id" then
      raise exception 'MCF mission % cannot be its own parent', new."id"
        using errcode = '23514';
    end if;

    if new."return_to_agent_id" is null then
      raise exception 'MCF child mission % requires returnToAgentId', new."id"
        using errcode = '23514';
    end if;

    if new."parent_checkpoint_state" is null then
      raise exception 'MCF child mission % requires a parent checkpoint', new."id"
        using errcode = '23514';
    end if;

    if new."state" = 'COMPLETED' and new."return_status" = 'PENDING' then
      new."return_status" := 'COMPLETED';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and new."state" = 'COMPLETED'
     and new."parent_mission_id" is null
     and exists (
       select 1
       from "mcf_missions" child
       where child."parent_mission_id" = new."id"
         and child."return_status" = 'PENDING'
         and child."state" <> 'CANCELLED'
     ) then
    new."state" := old."state";
    new."current_phase_id" := old."current_phase_id";
    new."current_agent_id" := old."current_agent_id";
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
declare
  restored_state text;
  restored_phase_id text;
  restored_agent_id text;
  return_event_type text;
  return_deferred boolean;
begin
  if new."parent_mission_id" is null
     or old."state" = 'COMPLETED'
     or new."state" <> 'COMPLETED'
     or new."return_status" <> 'COMPLETED' then
    return new;
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

  if exists (
    select 1
    from "mcf_missions" sibling
    where sibling."parent_mission_id" = new."parent_mission_id"
      and sibling."id" <> new."id"
      and sibling."return_status" = 'PENDING'
      and sibling."state" <> 'CANCELLED'
  ) then
    insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values (
      'hierarchy:deferred:' || new."parent_mission_id" || ':' || new."id",
      new."parent_mission_id",
      null,
      new."return_to_agent_id",
      'PARENT_RETURN_DEFERRED',
      jsonb_build_object(
        'childMissionId', new."id",
        'reason', 'OTHER_SUBMISSIONS_PENDING'
      ),
      'hierarchy:parent:' || new."parent_mission_id" || ':deferred:' || new."id",
      now()
    ) on conflict ("idempotency_key") do nothing;

    return new;
  end if;

  update "mcf_missions" parent
    set "state" = case
          when parent."state" in (
            'BLOCKED_RISK',
            'RECOVERING',
            'WAITING_EXTERNAL',
            'COMPLETED',
            'CANCELLED'
          ) then parent."state"
          else new."parent_checkpoint_state"
        end,
        "current_phase_id" = case
          when parent."state" in (
            'BLOCKED_RISK',
            'RECOVERING',
            'WAITING_EXTERNAL',
            'COMPLETED',
            'CANCELLED'
          ) then parent."current_phase_id"
          else new."parent_checkpoint_phase_id"
        end,
        "current_agent_id" = case
          when parent."state" in (
            'BLOCKED_RISK',
            'RECOVERING',
            'WAITING_EXTERNAL',
            'COMPLETED',
            'CANCELLED'
          ) then parent."current_agent_id"
          else new."return_to_agent_id"
        end,
        "version" = parent."version" + 1,
        "updated_at" = now()
    where parent."id" = new."parent_mission_id"
    returning parent."state", parent."current_phase_id", parent."current_agent_id"
      into restored_state, restored_phase_id, restored_agent_id;

  if not found then
    raise exception 'MCF parent mission % could not be restored', new."parent_mission_id"
      using errcode = '23514';
  end if;

  return_deferred := restored_state in (
    'BLOCKED_RISK',
    'RECOVERING',
    'WAITING_EXTERNAL',
    'COMPLETED',
    'CANCELLED'
  );
  return_event_type := case
    when return_deferred then 'PARENT_RETURN_DEFERRED'
    else 'PARENT_MISSION_RESUMED'
  end;

  insert into "mcf_events" (
    "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
    "idempotency_key", "occurred_at"
  ) values (
    'hierarchy:restore:' || new."parent_mission_id" || ':' || new."id",
    new."parent_mission_id",
    restored_phase_id,
    restored_agent_id,
    return_event_type,
    jsonb_build_object(
      'childMissionId', new."id",
      'returnToAgentId', new."return_to_agent_id",
      'restoredState', restored_state,
      'restoredPhaseId', restored_phase_id,
      'returnDeferred', return_deferred
    ),
    'hierarchy:parent:' || new."parent_mission_id" || ':restored:' || new."id",
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
