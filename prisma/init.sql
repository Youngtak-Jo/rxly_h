-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Speaker" AS ENUM ('DOCTOR', 'PATIENT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ChecklistSource" AS ENUM ('AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "NoteSource" AS ENUM ('MANUAL', 'STT', 'IMAGE');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "patient_name" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_entries" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "speaker" "Speaker" NOT NULL,
    "text" TEXT NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "key_findings" JSONB NOT NULL DEFAULT '[]',
    "red_flags" JSONB NOT NULL DEFAULT '[]',
    "last_processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "is_auto_checked" BOOLEAN NOT NULL DEFAULT false,
    "doctor_note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "source" "ChecklistSource" NOT NULL DEFAULT 'AI',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patient_name" TEXT,
    "chief_complaint" TEXT,
    "hpi_text" TEXT,
    "ros_text" TEXT,
    "pmh" TEXT,
    "social_history" TEXT,
    "family_history" TEXT,
    "vitals" JSONB,
    "physical_exam" TEXT,
    "labs_studies" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_handouts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "entries" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_handouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_urls" JSONB NOT NULL DEFAULT '[]',
    "source" "NoteSource" NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transcript_entries_session_id_start_time_idx" ON "transcript_entries"("session_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "insights_session_id_key" ON "insights"("session_id");

-- CreateIndex
CREATE INDEX "checklist_items_session_id_sort_order_idx" ON "checklist_items"("session_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_records_session_id_key" ON "consultation_records"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_handouts_session_id_key" ON "patient_handouts"("session_id");

-- CreateIndex
CREATE INDEX "notes_session_id_created_at_idx" ON "notes"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "transcript_entries" ADD CONSTRAINT "transcript_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_records" ADD CONSTRAINT "consultation_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_handouts" ADD CONSTRAINT "patient_handouts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
