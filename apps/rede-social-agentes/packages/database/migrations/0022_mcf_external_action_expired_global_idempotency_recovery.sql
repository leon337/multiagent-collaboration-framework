create or replace function "mcf_reap_expired_global_idempotency_holder"()
returns trigger
language plpgsql
as $$
declare
  holder record;
  recovered_at timestamptz := now();
begin
  if new."idempotency_scope_key" is null then
    return new;
  end if;

  select
    "attempt_id",
    "mission_id",
    "phase_id",
    "agent_id",
    "status",
    "lease_expires_at"
  into holder
  from "mcf_external_action_attempts"
  where "idempotency_scope_key" = new."idempotency_scope_key"
  limit 1
  for update;

  if holder."attempt_id" is null then
    return new;
  end if;

  if holder."status" = 'ALLOWED'
     and holder."lease_expires_at" <= recovered_at then
    update "mcf_external_action_attempts"
    set "status" = 'ABANDONED',
        "failure_code" = 'RESERVATION_EXPIRED',
        "failure_message" = 'Global external action reservation lease expired before replacement reservation',
        "idempotency_scope_key" = null,
        "updated_at" = recovered_at
    where "attempt_id" = holder."attempt_id"
      and "status" = 'ALLOWED'
      and "idempotency_scope_key" = new."idempotency_scope_key";

    update "mcf_missions"
    set "active_external_attempt_id" = null
    where "id" = holder."mission_id"
      and "active_external_attempt_id" = holder."attempt_id";

    insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values (
      'global-abandon:' || holder."attempt_id",
      holder."mission_id",
      holder."phase_id",
      holder."agent_id",
      'EXTERNAL_ACTION_ABANDONED',
      jsonb_build_object(
        'attemptId', holder."attempt_id",
        'previousStatus', 'ALLOWED',
        'reason', 'RESERVATION_EXPIRED',
        'scope', 'GLOBAL_IDEMPOTENCY',
        'idempotencyScopeKey', new."idempotency_scope_key"
      ),
      'external-action:' || holder."attempt_id" || ':abandoned',
      recovered_at
    )
    on conflict ("idempotency_key") do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists "mcf_reap_expired_global_idempotency_holder_before_insert"
  on "mcf_external_action_attempts";

create trigger "mcf_reap_expired_global_idempotency_holder_before_insert"
before insert on "mcf_external_action_attempts"
for each row
when (new."idempotency_scope_key" is not null)
execute function "mcf_reap_expired_global_idempotency_holder"();
