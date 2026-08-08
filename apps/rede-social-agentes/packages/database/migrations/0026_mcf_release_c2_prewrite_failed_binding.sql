-- MCF-RUNTIME-006-C2
-- Release the global idempotency binding only when a C2 attempt transitions
-- directly from ALLOWED to FAILED.
--
-- C2 contract invariant: any mutation that may have reached GitHub must return
-- a signed PARTIAL/UNKNOWN receipt and therefore must not take the
-- ALLOWED -> FAILED path. A direct FAILED transition is consequently a
-- pre-write/definitively-not-applied failure and must remain retryable.

create or replace function "mcf_release_c2_prewrite_failed_binding"()
returns trigger
language plpgsql
as $$
begin
  if old."adapter_id" = 'github-pr-collaboration-write-v1'
     and old."status" = 'ALLOWED'
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
  and old."status" = 'ALLOWED'
  and new."status" = 'FAILED'
  and old."idempotency_scope_key" is not null
)
execute function "mcf_release_c2_prewrite_failed_binding"();
