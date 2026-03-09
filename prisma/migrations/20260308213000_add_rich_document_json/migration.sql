ALTER TABLE "consultation_records"
ADD COLUMN "document_json" JSONB;

ALTER TABLE "patient_handouts"
ADD COLUMN "document_json" JSONB;
