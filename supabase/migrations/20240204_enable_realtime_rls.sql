-- Enable Realtime for streaming tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_agent_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_stream_events;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_stream_messages;

-- Enable RLS on tables (if not already)
ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_stream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_stream_messages ENABLE ROW LEVEL SECURITY;

-- Public read access for agent sessions (anyone can view streams)
CREATE POLICY "Public read access for agent sessions"
ON ai_agent_sessions FOR SELECT
TO public
USING (true);

-- Public read access for stream events (anyone can view stream content)
CREATE POLICY "Public read access for stream events"
ON ai_stream_events FOR SELECT
TO public
USING (true);

-- Public read access for chat messages (anyone can view chat)
CREATE POLICY "Public read access for stream messages"
ON ai_stream_messages FOR SELECT
TO public
USING (true);

-- Service role can do everything (for the state server)
CREATE POLICY "Service role full access for sessions"
ON ai_agent_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access for events"
ON ai_stream_events FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access for messages"
ON ai_stream_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Anyone can insert chat messages (viewers can chat)
CREATE POLICY "Anyone can send chat messages"
ON ai_stream_messages FOR INSERT
TO public
WITH CHECK (sender_type = 'viewer');
