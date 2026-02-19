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

-- CreateIndex
CREATE UNIQUE INDEX "patient_handouts_session_id_key" ON "patient_handouts"("session_id");

-- AddForeignKey
ALTER TABLE "patient_handouts" ADD CONSTRAINT "patient_handouts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
