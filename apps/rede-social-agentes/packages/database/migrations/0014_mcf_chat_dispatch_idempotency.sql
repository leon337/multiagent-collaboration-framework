create table if not exists "mcf_chat_dispatches" (
  "account_id" text not null references "accounts"("id") on delete restrict,
  "dispatch_id" text not null,
  "request_digest" text not null,
  "state" text not null check ("state" in ('IN_PROGRESS', 'COMPLETED')),
  "mission_id" text references "mcf_missions"("id") on delete set null,
  "response" jsonb,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  primary key ("account_id", "dispatch_id"),
  check (char_length("dispatch_id") between 8 and 128),
  check ("request_digest" ~ '^[a-f0-9]{64}$'),
  check (
    ("state" = 'IN_PROGRESS' and "response" is null)
    or
    ("state" = 'COMPLETED' and "mission_id" is not null and "response" is not null)
  )
);

create index if not exists "mcf_chat_dispatches_mission_idx"
  on "mcf_chat_dispatches" ("mission_id");
