-- CreateTable
CREATE TABLE "research_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_messages_session_id_created_at_idx" ON "research_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "transcript_entries_session_id_is_final_start_time_idx" ON "transcript_entries"("session_id", "is_final", "start_time");

-- AddForeignKey
ALTER TABLE "research_messages" ADD CONSTRAINT "research_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
