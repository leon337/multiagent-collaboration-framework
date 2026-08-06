create or replace function "mcf_validate_child_parent_gate"()
returns trigger
language plpgsql
as $$
declare
  requested_parent_id text;
  requested_return_agent_id text;
  parent_state text;
  parent_contract jsonb;
begin
  requested_parent_id := nullif(new."contract" ->> 'parentMissionId', '');
  requested_return_agent_id := nullif(new."contract" ->> 'returnToAgentId', '');

  if requested_parent_id is null then
    return new;
  end if;

  if requested_return_agent_id is null then
    raise exception 'MCF child mission % requires returnToAgentId', new."id"
      using errcode = '23514';
  end if;

  select "state", "contract"
    into parent_state, parent_contract
    from "mcf_missions"
    where "id" = requested_parent_id
    for update;

  if not found then
    raise exception 'MCF parent mission % does not exist', requested_parent_id
      using errcode = '23503';
  end if;

  if parent_state in ('COMPLETED', 'CANCELLED') then
    raise exception 'MCF parent mission % is not active', requested_parent_id
      using errcode = '23514';
  end if;

  if lower(trim(requested_return_agent_id)) = 'leandro' then
    raise exception 'Leandro cannot receive a technical parent return'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements_text(coalesce(parent_contract -> 'selectedAgents', '[]'::jsonb))
      as selected("agent_id")
    where selected."agent_id" = requested_return_agent_id
  ) then
    raise exception 'return target % was not selected by parent mission %',
      requested_return_agent_id,
      requested_parent_id
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists "mcf_child_parent_gate_before_insert" on "mcf_missions";
create trigger "mcf_child_parent_gate_before_insert"
before insert on "mcf_missions"
for each row execute function "mcf_validate_child_parent_gate"();

create or replace function "mcf_guard_any_mission_with_pending_children"()
returns trigger
language plpgsql
as $$
declare
  has_pending_children boolean;
begin
  select exists (
    select 1
    from "mcf_missions" child
    where child."parent_mission_id" = new."id"
      and child."return_status" = 'PENDING'
      and child."state" <> 'CANCELLED'
  ) into has_pending_children;

  if not has_pending_children then
    return new;
  end if;

  if new."state" = 'COMPLETED' then
    new."state" := old."state";
    new."current_phase_id" := old."current_phase_id";
    new."current_agent_id" := old."current_agent_id";
  elsif new."state" in ('BLOCKED_RISK', 'RECOVERING', 'WAITING_EXTERNAL', 'CANCELLED') then
    null;
  elsif new."state" is distinct from old."state"
     or new."current_phase_id" is distinct from old."current_phase_id"
     or new."current_agent_id" is distinct from old."current_agent_id" then
    raise exception 'MCF mission % is suspended while a submission is pending', new."id"
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists "mcf_guard_any_mission_with_pending_children" on "mcf_missions";
create trigger "mcf_guard_any_mission_with_pending_children"
before update on "mcf_missions"
for each row execute function "mcf_guard_any_mission_with_pending_children"();

drop trigger if exists "mcf_resume_parent_after_child_completion" on "mcf_missions";
create constraint trigger "mcf_resume_parent_after_child_completion"
after update on "mcf_missions"
deferrable initially deferred
for each row execute function "mcf_resume_parent_after_child_completion"();
