ALTER TABLE "transcript_entries"
ADD COLUMN "recording_segment_id" TEXT;

CREATE INDEX "transcript_entries_recording_segment_id_idx"
ON "transcript_entries"("recording_segment_id");

ALTER TABLE "transcript_entries"
ADD CONSTRAINT "transcript_entries_recording_segment_id_fkey"
FOREIGN KEY ("recording_segment_id") REFERENCES "recording_segments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
