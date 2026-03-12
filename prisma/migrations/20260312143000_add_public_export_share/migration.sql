CREATE TYPE "ExportLinkAccessMode" AS ENUM ('OWNER_AUTH', 'PUBLIC_LINK');

CREATE TYPE "ExportLinkChannel" AS ENUM ('EMAIL_SECURE', 'PATIENT_SHARE');

ALTER TABLE "export_links"
ADD COLUMN "session_document_id" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "access_mode" "ExportLinkAccessMode" NOT NULL DEFAULT 'OWNER_AUTH',
ADD COLUMN "channel" "ExportLinkChannel" NOT NULL DEFAULT 'EMAIL_SECURE',
ADD COLUMN "revoked_at" TIMESTAMP(3),
ADD COLUMN "last_accessed_at" TIMESTAMP(3);

ALTER TABLE "export_links"
ALTER COLUMN "expires_at" DROP NOT NULL;

CREATE INDEX "export_links_session_document_id_idx" ON "export_links"("session_document_id");

CREATE INDEX "export_links_session_document_id_access_mode_revoked_at_idx" ON "export_links"("session_document_id", "access_mode", "revoked_at");

CREATE INDEX "export_links_channel_created_at_idx" ON "export_links"("channel", "created_at");
