-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('DOCTOR', 'AI_DOCTOR');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "mode" "SessionMode" NOT NULL DEFAULT 'DOCTOR';
