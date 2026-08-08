-- MCF-RUNTIME-006-C2 independent-review remediation round 2.
--
-- A definitively pre-write FAILED attempt must remain retryable, but its global
-- idempotency scope cannot be released immediately: doing so forgets the
-- request fingerprint and lets another mission bind the same key to a different
-- payload. Keep the FAILED row as a durable key/fingerprint tombstone and only
-- release it from the BEFORE INSERT recovery trigger when the incoming retry
-- proves fingerprint compatibility.

-- Migration 0027 released C2 FAILED bindings during the status transition.
-- Disable that eager release. The holder row now retains both scope and
-- fingerprint until a compatible replacement is actually being inserted.
drop trigger if exists "mcf_release_c2_prewrite_failed_binding_before_update"
  on "mcf_external_action_attempts";

create or replace function "mcf_reap_expired_global_idempotency_holder"()
returns trigger
language plpgsql
as $$
declare
  holder record;
  recovered_at timestamptz := now();
  compatible_fingerprint boolean := false;
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
    "failure_code",
    "lease_expires_at",
    "idempotency_scope_key",
    "idempotency_fingerprint"
  into holder
  from "mcf_external_action_attempts"
  where "idempotency_scope_key" = new."idempotency_scope_key"
  limit 1
  for update;

  if holder."attempt_id" is null
     or holder."idempotency_scope_key" is distinct from new."idempotency_scope_key" then
    return new;
  end if;

  compatible_fingerprint :=
    holder."idempotency_fingerprint" is not null
    and new."idempotency_fingerprint" is not null
    and holder."idempotency_fingerprint" = new."idempotency_fingerprint";

  -- FAILED is a definitively-not-applied outcome under the C2 dispatcher
  -- contract. It may be replaced, but only by the same canonical request.
  -- An incompatible request leaves the tombstone bound and therefore reaches
  -- the persistent unique index, which fails closed.
  if holder."status" = 'FAILED' then
    if compatible_fingerprint then
      update "mcf_external_action_attempts"
      set "idempotency_scope_key" = null,
          "updated_at" = recovered_at
      where "attempt_id" = holder."attempt_id"
        and "status" = 'FAILED'
        and "idempotency_scope_key" = new."idempotency_scope_key"
        and "idempotency_fingerprint" = new."idempotency_fingerprint";
    end if;
    return new;
  end if;

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

    -- Do not lock or update the holder mission here. reserve() may already hold
    -- the requester mission row, so touching another mission can create an
    -- A->B/B->A lock cycle. The stale holder mission pointer is safely cleaned
    -- by reconcileExpiredExternalReservation when that mission is next touched.

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
        'compatibleFingerprint', compatible_fingerprint,
        'holderMissionPointerCleanup', 'DEFERRED_TO_MISSION_RECONCILIATION'
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
