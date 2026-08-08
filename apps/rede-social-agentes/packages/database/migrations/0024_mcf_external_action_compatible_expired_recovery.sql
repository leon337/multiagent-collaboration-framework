create or replace function "mcf_reap_expired_global_idempotency_holder"()
returns trigger
language plpgsql
as $$
declare
  holder_locator record;
  holder record;
  recovered_at timestamptz := now();
  compatible_fingerprint boolean := false;
begin
  if new."idempotency_scope_key" is null then
    return new;
  end if;

  select
    "attempt_id",
    "mission_id"
  into holder_locator
  from "mcf_external_action_attempts"
  where "idempotency_scope_key" = new."idempotency_scope_key"
  limit 1;

  if holder_locator."attempt_id" is null then
    return new;
  end if;

  perform 1
  from "mcf_missions"
  where "id" = holder_locator."mission_id"
  for update;

  select
    "attempt_id",
    "mission_id",
    "phase_id",
    "agent_id",
    "status",
    "failure_code",
    "lease_expires_at",
    "idempotency_scope_key",
    "idempotency_fingerprint"
  into holder
  from "mcf_external_action_attempts"
  where "attempt_id" = holder_locator."attempt_id"
  for update;

  if holder."attempt_id" is null
     or holder."idempotency_scope_key" is distinct from new."idempotency_scope_key" then
    return new;
  end if;

  compatible_fingerprint :=
    holder."idempotency_fingerprint" is not null
    and new."idempotency_fingerprint" is not null
    and holder."idempotency_fingerprint" = new."idempotency_fingerprint";

  if holder."lease_expires_at" <= recovered_at
     and holder."status" = 'ALLOWED' then
    update "mcf_external_action_attempts"
    set "status" = 'ABANDONED',
        "failure_code" = 'RESERVATION_EXPIRED',
        "failure_message" = 'Global external action reservation lease expired before replacement reservation',
        "idempotency_scope_key" = case
          when compatible_fingerprint then null
          else "idempotency_scope_key"
        end,
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
        'idempotencyScopeKey', new."idempotency_scope_key",
        'compatibleFingerprint', compatible_fingerprint
      ),
      'external-action:' || holder."attempt_id" || ':abandoned',
      recovered_at
    )
    on conflict ("idempotency_key") do nothing;

    return new;
  end if;

  if holder."lease_expires_at" <= recovered_at
     and holder."status" = 'ABANDONED'
     and holder."failure_code" = 'RESERVATION_EXPIRED'
     and compatible_fingerprint then
    update "mcf_external_action_attempts"
    set "idempotency_scope_key" = null,
        "updated_at" = recovered_at
    where "attempt_id" = holder."attempt_id"
      and "status" = 'ABANDONED'
      and "failure_code" = 'RESERVATION_EXPIRED'
      and "idempotency_scope_key" = new."idempotency_scope_key"
      and "idempotency_fingerprint" = new."idempotency_fingerprint";
  end if;

  return new;
end;
$$;
