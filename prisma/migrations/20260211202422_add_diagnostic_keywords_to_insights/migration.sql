-- AlterTable
ALTER TABLE "insights" ADD COLUMN     "diagnostic_keywords" JSONB NOT NULL DEFAULT '[]';
