drop index if exists "mcf_external_action_attempts_active_global_idempotency_idx";

create unique index if not exists "mcf_external_action_attempts_global_idempotency_idx"
  on "mcf_external_action_attempts" ("idempotency_scope_key")
  where "idempotency_scope_key" is not null;
