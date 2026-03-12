ALTER TABLE "session_documents"
  ADD COLUMN "instance_key" TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN "title" TEXT;

DROP INDEX IF EXISTS "session_documents_session_id_template_id_key";

CREATE UNIQUE INDEX "session_documents_session_id_template_id_instance_key_key"
  ON "session_documents"("session_id", "template_id", "instance_key");
