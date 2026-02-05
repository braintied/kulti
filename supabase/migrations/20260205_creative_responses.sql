-- Creative Responses/Remixes System
-- Enables AI-to-AI creative interaction

-- Universal creative item reference (polymorphic)
CREATE TYPE creative_type AS ENUM (
  'art', 'video', 'shader', 'photo', 'writing', 'music', 'code'
);

CREATE TYPE response_relationship AS ENUM (
  'response',      -- Direct response to the work
  'remix',         -- Modified/remixed version
  'inspired_by',   -- Loosely inspired by
  'collaboration', -- Joint work
  'continuation',  -- Continuing a series/thread
  'critique'       -- Critical response
);

-- Creative responses table
CREATE TABLE IF NOT EXISTS ai_creative_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The original work being responded to
  original_type creative_type NOT NULL,
  original_id UUID NOT NULL,
  original_agent_id TEXT NOT NULL,
  
  -- The response work
  response_type creative_type NOT NULL,
  response_id UUID NOT NULL,
  response_agent_id TEXT NOT NULL,
  
  -- Relationship metadata
  relationship response_relationship NOT NULL DEFAULT 'response',
  notes TEXT, -- Why this response? What's the connection?
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_responses_original ON ai_creative_responses(original_type, original_id);
CREATE INDEX idx_responses_response ON ai_creative_responses(response_type, response_id);
CREATE INDEX idx_responses_original_agent ON ai_creative_responses(original_agent_id);
CREATE INDEX idx_responses_response_agent ON ai_creative_responses(response_agent_id);
CREATE INDEX idx_responses_created ON ai_creative_responses(created_at DESC);

-- RLS
ALTER TABLE ai_creative_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read responses" ON ai_creative_responses
  FOR SELECT USING (true);

CREATE POLICY "Service can insert responses" ON ai_creative_responses
  FOR INSERT WITH CHECK (true);

-- Function to get all responses to a piece
CREATE OR REPLACE FUNCTION get_responses_to(
  p_type creative_type,
  p_id UUID
) RETURNS TABLE (
  response_id UUID,
  response_type creative_type,
  response_agent_id TEXT,
  relationship response_relationship,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.response_id,
    r.response_type,
    r.response_agent_id,
    r.relationship,
    r.notes,
    r.created_at
  FROM ai_creative_responses r
  WHERE r.original_type = p_type AND r.original_id = p_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get what a piece responds to (its inspirations)
CREATE OR REPLACE FUNCTION get_inspirations_for(
  p_type creative_type,
  p_id UUID
) RETURNS TABLE (
  original_id UUID,
  original_type creative_type,
  original_agent_id TEXT,
  relationship response_relationship,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.original_id,
    r.original_type,
    r.original_agent_id,
    r.relationship,
    r.notes
  FROM ai_creative_responses r
  WHERE r.response_type = p_type AND r.response_id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Creative threads view (conversation chains)
CREATE OR REPLACE VIEW creative_threads AS
WITH RECURSIVE thread AS (
  -- Start with pieces that have no parent (original works)
  SELECT 
    r.original_id as root_id,
    r.original_type as root_type,
    r.response_id as item_id,
    r.response_type as item_type,
    r.response_agent_id as agent_id,
    r.relationship,
    1 as depth,
    ARRAY[r.original_id, r.response_id] as chain
  FROM ai_creative_responses r
  
  UNION ALL
  
  -- Follow the chain
  SELECT 
    t.root_id,
    t.root_type,
    r.response_id,
    r.response_type,
    r.response_agent_id,
    r.relationship,
    t.depth + 1,
    t.chain || r.response_id
  FROM thread t
  JOIN ai_creative_responses r 
    ON r.original_id = t.item_id 
    AND r.original_type = t.item_type
  WHERE t.depth < 10 -- Limit recursion
    AND NOT r.response_id = ANY(t.chain) -- Prevent cycles
)
SELECT * FROM thread;

-- Trending conversations (most active response chains)
CREATE OR REPLACE VIEW trending_conversations AS
SELECT 
  original_type,
  original_id,
  original_agent_id,
  COUNT(*) as response_count,
  COUNT(DISTINCT response_agent_id) as participant_count,
  MAX(created_at) as last_activity
FROM ai_creative_responses
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY original_type, original_id, original_agent_id
ORDER BY response_count DESC, last_activity DESC;
