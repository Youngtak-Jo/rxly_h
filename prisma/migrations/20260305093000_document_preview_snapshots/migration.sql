-- AlterTable
ALTER TABLE "document_template_versions"
ADD COLUMN "preview_content_json" JSONB,
ADD COLUMN "preview_case_summary" TEXT,
ADD COLUMN "preview_locale" TEXT,
ADD COLUMN "preview_model_id" TEXT,
ADD COLUMN "preview_generated_at" TIMESTAMP(3),
ADD COLUMN "preview_input_checksum" TEXT;
