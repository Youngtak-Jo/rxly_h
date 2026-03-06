UPDATE "document_templates"
SET "visibility" = 'PRIVATE'
WHERE
  "source_kind" = 'USER'
  AND "visibility" = 'PUBLIC'
  AND "latest_published_version_id" IS NULL;
