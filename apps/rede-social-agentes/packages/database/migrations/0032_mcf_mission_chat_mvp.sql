-- Chat is a collaboration view, not an execution/ACK ledger.
-- Messages cannot grant authority, move mission state or verify agent execution.
create table if not exists "mcf_chat_messages" (
  "sequence" bigint generated always as identity primary key,
  "id" uuid not null unique,
  "room_id" text not null,
  "mission_id" text references "mcf_missions"("id") on delete cascade,
  "actor_kind" text not null check ("actor_kind" in ('HUMAN', 'AGENT_REPORTED')),
  "actor_id" text not null,
  "actor_label" text not null,
  "kind" text not null check ("kind" in ('MESSAGE', 'TASK', 'RESULT', 'BLOCKER', 'HANDOFF', 'APPROVAL_REQUEST')),
  "content" text not null check (length("content") between 1 and 4000),
  "trust_label" text not null check ("trust_label" in ('AUTHENTICATED_HUMAN', 'RUNTIME_REPORTED')),
  "idempotency_key" text unique,
  "request_fingerprint" text,
  "created_at" timestamptz not null default now(),
  constraint "mcf_chat_room_boundary" check (
    ("room_id" = 'geral' and "mission_id" is null) or
    ("room_id" <> 'geral' and "room_id" = "mission_id")
  )
);
create index if not exists "mcf_chat_room_sequence_idx"
  on "mcf_chat_messages" ("room_id", "sequence");
