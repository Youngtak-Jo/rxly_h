CREATE TYPE "DocumentTemplateScope" AS ENUM ('LIBRARY', 'SESSION_ONLY');

ALTER TABLE "document_templates"
  ADD COLUMN "scope" "DocumentTemplateScope" NOT NULL DEFAULT 'LIBRARY',
  ADD COLUMN "origin_session_id" TEXT;

ALTER TABLE "document_templates"
  ADD CONSTRAINT "document_templates_origin_session_id_fkey"
  FOREIGN KEY ("origin_session_id") REFERENCES "sessions"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE INDEX "document_templates_scope_updated_at_idx"
  ON "document_templates"("scope", "updated_at");
