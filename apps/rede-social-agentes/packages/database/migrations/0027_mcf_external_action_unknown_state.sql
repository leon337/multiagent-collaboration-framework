-- MCF-RUNTIME-006-C2 independent-review remediation.
--
-- ALLOWED means no adapter mutation has been permitted to start yet.
-- EXECUTING is persisted immediately before adapter.execute(), so an expired
-- execution can no longer be mistaken for an unused reservation.
-- UNKNOWN means an external mutation may have been applied and therefore its
-- idempotency binding must remain durable until explicit reconciliation.

alter table "mcf_external_action_attempts"
  drop constraint if exists "mcf_external_action_attempts_status_check";

alter table "mcf_external_action_attempts"
  add constraint "mcf_external_action_attempts_status_check"
  check (
    "status" in (
      'ALLOWED',
      'EXECUTING',
      'EXECUTED',
      'UNKNOWN',
      'FAILED',
      'EVIDENCE_VALIDATED',
      'EVIDENCE_REJECTED',
      'ABANDONED'
    )
  );

-- Keep lease lookups efficient for all states that may still need stale-pointer
-- or ambiguity recovery. UNKNOWN remains bound; this index does not release it.
drop index if exists "mcf_external_action_attempts_lease_idx";
create index "mcf_external_action_attempts_lease_idx"
  on "mcf_external_action_attempts" ("lease_expires_at")
  where "status" in (
    'ALLOWED',
    'EXECUTING',
    'EXECUTED',
    'UNKNOWN',
    'FAILED',
    'EVIDENCE_VALIDATED',
    'EVIDENCE_REJECTED'
  );

-- Supersede migration 0026's release trigger. FAILED remains a
-- definitively-not-applied outcome. The dispatcher may reach FAILED from
-- EXECUTING only when adapter.execute() itself throws according to the adapter
-- contract; PARTIAL/UNKNOWN receipts and post-write ledger failures never use
-- this transition.
create or replace function "mcf_release_c2_prewrite_failed_binding"()
returns trigger
language plpgsql
as $$
begin
  if old."adapter_id" = 'github-pr-collaboration-write-v1'
     and old."status" in ('ALLOWED', 'EXECUTING')
     and new."status" = 'FAILED'
     and old."idempotency_scope_key" is not null then
    new."idempotency_scope_key" := null;
  end if;

  return new;
end;
$$;

drop trigger if exists "mcf_release_c2_prewrite_failed_binding_before_update"
  on "mcf_external_action_attempts";

create trigger "mcf_release_c2_prewrite_failed_binding_before_update"
before update of "status" on "mcf_external_action_attempts"
for each row
when (
  old."adapter_id" = 'github-pr-collaboration-write-v1'
  and old."status" in ('ALLOWED', 'EXECUTING')
  and new."status" = 'FAILED'
  and old."idempotency_scope_key" is not null
)
execute function "mcf_release_c2_prewrite_failed_binding"();
