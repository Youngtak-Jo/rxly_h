-- CreateEnum
CREATE TYPE "DiagnosisConfidence" AS ENUM ('HIGH', 'MODERATE', 'LOW');

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "icd_code" TEXT NOT NULL,
    "icd_uri" TEXT,
    "disease_name" TEXT NOT NULL,
    "confidence" "DiagnosisConfidence" NOT NULL DEFAULT 'MODERATE',
    "evidence" TEXT NOT NULL,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagnoses_session_id_sort_order_idx" ON "diagnoses"("session_id", "sort_order");

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
