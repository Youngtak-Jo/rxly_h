CREATE TABLE "recording_segments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recording_segments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recording_segments_storage_path_key" ON "recording_segments"("storage_path");
CREATE INDEX "recording_segments_session_id_started_at_idx" ON "recording_segments"("session_id", "started_at");

ALTER TABLE "recording_segments"
ADD CONSTRAINT "recording_segments_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
