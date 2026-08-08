alter table "mcf_external_action_attempts"
  add column if not exists "idempotency_scope_key" text;

create unique index if not exists "mcf_external_action_attempts_active_global_idempotency_idx"
  on "mcf_external_action_attempts" ("idempotency_scope_key")
  where "idempotency_scope_key" is not null
    and "status" = 'ALLOWED';
