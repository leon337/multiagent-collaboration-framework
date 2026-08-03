CREATE INDEX "social_content_published_feed_idx"
  ON "social_content" ("published_at" DESC, "id" DESC)
  WHERE "status" = 'PUBLISHED';
