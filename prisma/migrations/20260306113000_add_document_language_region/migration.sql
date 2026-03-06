ALTER TABLE "document_templates"
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "region" TEXT NOT NULL DEFAULT 'global';

UPDATE "document_templates"
SET
  "language" = 'en',
  "region" = 'global'
WHERE
  "language" IS NULL
  OR "region" IS NULL;
