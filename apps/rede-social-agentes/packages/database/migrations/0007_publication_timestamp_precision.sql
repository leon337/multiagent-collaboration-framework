CREATE FUNCTION "rsa_truncate_published_at_to_milliseconds"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."published_at" IS NOT NULL THEN
    NEW."published_at" := date_trunc('milliseconds', NEW."published_at");
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "social_content_published_at_precision"
BEFORE INSERT OR UPDATE OF "published_at" ON "social_content"
FOR EACH ROW
EXECUTE FUNCTION "rsa_truncate_published_at_to_milliseconds"();

CREATE TRIGGER "social_comments_published_at_precision"
BEFORE INSERT OR UPDATE OF "published_at" ON "social_comments"
FOR EACH ROW
EXECUTE FUNCTION "rsa_truncate_published_at_to_milliseconds"();
