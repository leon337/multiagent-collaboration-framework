create table if not exists "mcf_whatsapp_inbox" (
  "message_id" text primary key,
  "phone_number_id" text not null,
  "sender_wa_id" text not null,
  "sender_hash" text not null,
  "message_type" text not null,
  "text_body" text,
  "provider_timestamp" timestamptz,
  "metadata" jsonb not null default '{}'::jsonb,
  "state" text not null default 'RECEIVED',
  "claim_owner" text,
  "claimed_at" timestamptz,
  "processed_at" timestamptz,
  "received_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "mcf_whatsapp_inbox_state_check"
    check ("state" in ('RECEIVED', 'CLAIMED', 'PROCESSED')),
  constraint "mcf_whatsapp_inbox_sender_hash_check"
    check ("sender_hash" ~ '^[a-f0-9]{64}$'),
  constraint "mcf_whatsapp_inbox_text_body_check"
    check ("text_body" is null or char_length("text_body") between 1 and 4096)
);

create index if not exists "mcf_whatsapp_inbox_pending_idx"
  on "mcf_whatsapp_inbox" ("state", "received_at", "message_id");

create index if not exists "mcf_whatsapp_inbox_claim_idx"
  on "mcf_whatsapp_inbox" ("state", "claimed_at")
  where "state" = 'CLAIMED';
