CREATE TABLE "abuse_rate_limits" (
  "key_hash" text NOT NULL,
  "policy" text NOT NULL,
  "window_started_at" timestamptz NOT NULL,
  "request_count" integer NOT NULL DEFAULT 1,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("key_hash", "policy", "window_started_at"),
  CONSTRAINT "abuse_rate_limits_key_hash_shape" CHECK (
    "key_hash" ~ '^[a-f0-9]{64}$'
  ),
  CONSTRAINT "abuse_rate_limits_policy_length" CHECK (
    char_length("policy") BETWEEN 1 AND 120
  ),
  CONSTRAINT "abuse_rate_limits_request_count_positive" CHECK (
    "request_count" >= 1
  )
);

CREATE INDEX "abuse_rate_limits_cleanup_idx"
  ON "abuse_rate_limits" ("window_started_at");
