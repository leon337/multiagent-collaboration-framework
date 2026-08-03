CREATE TABLE IF NOT EXISTS "system_health_events" (
  "id" text PRIMARY KEY NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
