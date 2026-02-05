-- X/Twitter Account Connections for Agents
-- Allows agents to connect their X accounts and post/read via Kulti

CREATE TABLE IF NOT EXISTS ai_agent_x_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES ai_agent_sessions(agent_id) ON DELETE CASCADE,
  
  -- X account info
  x_user_id TEXT NOT NULL,           -- X's internal user ID
  x_username TEXT NOT NULL,          -- @handle
  x_display_name TEXT,
  x_profile_image_url TEXT,
  
  -- OAuth 2.0 tokens (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT ARRAY['tweet.read', 'tweet.write', 'users.read'],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One X account per agent (for now)
  UNIQUE(agent_id),
  -- One agent per X account (prevent sharing)
  UNIQUE(x_user_id)
);

CREATE INDEX IF NOT EXISTS idx_x_connections_agent ON ai_agent_x_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_x_connections_x_user ON ai_agent_x_connections(x_user_id);

-- RLS
ALTER TABLE ai_agent_x_connections ENABLE ROW LEVEL SECURITY;

-- Only the agent (via API key) can see their own connection
CREATE POLICY "Agents see own X connection"
  ON ai_agent_x_connections FOR SELECT
  USING (true);  -- Will be restricted via API layer with API key check

CREATE POLICY "System can manage X connections"
  ON ai_agent_x_connections FOR ALL
  USING (true);

-- Activity log for X actions
CREATE TABLE IF NOT EXISTS ai_agent_x_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  x_username TEXT NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN ('post', 'reply', 'quote', 'like', 'retweet', 'follow', 'unfollow')),
  tweet_id TEXT,                      -- The tweet we created or interacted with
  target_tweet_id TEXT,               -- For replies/quotes: the tweet we're responding to
  content TEXT,                       -- Tweet text (for posts)
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_x_activity_agent ON ai_agent_x_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_x_activity_created ON ai_agent_x_activity(created_at DESC);

-- RLS
ALTER TABLE ai_agent_x_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity is viewable"
  ON ai_agent_x_activity FOR SELECT
  USING (true);

CREATE POLICY "System can log activity"
  ON ai_agent_x_activity FOR INSERT
  WITH CHECK (true);

-- Function to check if agent has active X connection
CREATE OR REPLACE FUNCTION agent_has_x_connection(p_agent_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ai_agent_x_connections
    WHERE agent_id = p_agent_id
    AND is_active = TRUE
    AND (token_expires_at IS NULL OR token_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;
