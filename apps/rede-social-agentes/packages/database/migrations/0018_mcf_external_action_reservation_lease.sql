alter table "mcf_external_action_attempts"
  add column if not exists "lease_expires_at" timestamptz;

update "mcf_external_action_attempts"
set "lease_expires_at" = coalesce("lease_expires_at", "updated_at" + interval '10 minutes')
where "lease_expires_at" is null;

alter table "mcf_external_action_attempts"
  alter column "lease_expires_at" set not null;

alter table "mcf_external_action_attempts"
  drop constraint if exists "mcf_external_action_attempts_status_check";

alter table "mcf_external_action_attempts"
  add constraint "mcf_external_action_attempts_status_check"
  check (
    "status" in (
      'ALLOWED',
      'EXECUTED',
      'FAILED',
      'EVIDENCE_VALIDATED',
      'EVIDENCE_REJECTED',
      'ABANDONED'
    )
  );

create index if not exists "mcf_external_action_attempts_lease_idx"
  on "mcf_external_action_attempts" ("lease_expires_at")
  where "status" in ('ALLOWED', 'EXECUTED', 'FAILED', 'EVIDENCE_VALIDATED', 'EVIDENCE_REJECTED');
