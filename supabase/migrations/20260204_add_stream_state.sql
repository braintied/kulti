-- Add stream_state column to sessions table for live streaming
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stream_state jsonb DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_stream_state ON sessions USING gin (stream_state);

-- Enable realtime for sessions table (if not already)
ALTER publication supabase_realtime ADD TABLE sessions;
