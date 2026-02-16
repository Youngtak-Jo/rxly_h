-- Add composite index for session list hot path (user filter + started_at sort)
CREATE INDEX IF NOT EXISTS "sessions_user_id_started_at_idx"
ON "sessions"("user_id", "started_at");

-- Add index for export link cleanup by session id
CREATE INDEX IF NOT EXISTS "export_links_session_id_idx"
ON "export_links"("session_id");
