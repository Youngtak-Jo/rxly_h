CREATE TYPE "DocumentTemplateSourceKind" AS ENUM ('BUILT_IN', 'USER');
CREATE TYPE "DocumentTemplateRenderer" AS ENUM ('BUILT_IN_RECORD', 'BUILT_IN_PATIENT_HANDOUT', 'GENERIC_STRUCTURED');
CREATE TYPE "DocumentTemplateVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "DocumentTemplateVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "document_templates" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "owner_user_id" TEXT,
  "source_kind" "DocumentTemplateSourceKind" NOT NULL DEFAULT 'USER',
  "renderer" "DocumentTemplateRenderer" NOT NULL,
  "visibility" "DocumentTemplateVisibility" NOT NULL DEFAULT 'PRIVATE',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "icon_key" TEXT NOT NULL DEFAULT 'file-text',
  "category" TEXT NOT NULL DEFAULT 'general',
  "latest_draft_version_id" TEXT,
  "latest_published_version_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_template_versions" (
  "id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "status" "DocumentTemplateVersionStatus" NOT NULL,
  "schema_json" JSONB NOT NULL,
  "generation_config_json" JSONB NOT NULL,
  "changelog" TEXT DEFAULT '',
  "created_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_installed_documents" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "installed_version_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_installed_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_workspace_layouts" (
  "user_id" TEXT NOT NULL,
  "tab_order_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_workspace_layouts_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "session_documents" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "template_version_id" TEXT NOT NULL,
  "content_json" JSONB NOT NULL DEFAULT '{}',
  "generated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_templates_slug_key" ON "document_templates"("slug");
CREATE UNIQUE INDEX "document_templates_latest_draft_version_id_key" ON "document_templates"("latest_draft_version_id");
CREATE UNIQUE INDEX "document_templates_latest_published_version_id_key" ON "document_templates"("latest_published_version_id");
CREATE INDEX "document_templates_owner_user_id_updated_at_idx" ON "document_templates"("owner_user_id", "updated_at");
CREATE INDEX "document_templates_visibility_updated_at_idx" ON "document_templates"("visibility", "updated_at");
CREATE INDEX "document_templates_source_kind_renderer_idx" ON "document_templates"("source_kind", "renderer");

CREATE UNIQUE INDEX "document_template_versions_template_id_version_number_key" ON "document_template_versions"("template_id", "version_number");
CREATE INDEX "document_template_versions_template_id_status_created_at_idx" ON "document_template_versions"("template_id", "status", "created_at");

CREATE UNIQUE INDEX "user_installed_documents_user_id_template_id_key" ON "user_installed_documents"("user_id", "template_id");
CREATE INDEX "user_installed_documents_user_id_updated_at_idx" ON "user_installed_documents"("user_id", "updated_at");

CREATE UNIQUE INDEX "session_documents_session_id_template_id_key" ON "session_documents"("session_id", "template_id");
CREATE INDEX "session_documents_session_id_updated_at_idx" ON "session_documents"("session_id", "updated_at");
CREATE INDEX "session_documents_template_id_updated_at_idx" ON "session_documents"("template_id", "updated_at");

ALTER TABLE "document_template_versions"
  ADD CONSTRAINT "document_template_versions_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "document_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_templates"
  ADD CONSTRAINT "document_templates_latest_draft_version_id_fkey"
  FOREIGN KEY ("latest_draft_version_id") REFERENCES "document_template_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_templates"
  ADD CONSTRAINT "document_templates_latest_published_version_id_fkey"
  FOREIGN KEY ("latest_published_version_id") REFERENCES "document_template_versions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_installed_documents"
  ADD CONSTRAINT "user_installed_documents_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "document_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_installed_documents"
  ADD CONSTRAINT "user_installed_documents_installed_version_id_fkey"
  FOREIGN KEY ("installed_version_id") REFERENCES "document_template_versions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session_documents"
  ADD CONSTRAINT "session_documents_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session_documents"
  ADD CONSTRAINT "session_documents_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "document_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session_documents"
  ADD CONSTRAINT "session_documents_template_version_id_fkey"
  FOREIGN KEY ("template_version_id") REFERENCES "document_template_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
