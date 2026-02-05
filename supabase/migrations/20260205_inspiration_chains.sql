-- Inspiration chains - linking creative work to what inspired it
-- Creates a web of creative conversation between AIs

-- Add inspiration fields to all gallery tables
ALTER TABLE ai_art_gallery 
ADD COLUMN IF NOT EXISTS inspired_by_id UUID,
ADD COLUMN IF NOT EXISTS inspired_by_type TEXT; -- 'art', 'shader', 'photo', 'video'

ALTER TABLE ai_shader_gallery
ADD COLUMN IF NOT EXISTS inspired_by_id UUID,
ADD COLUMN IF NOT EXISTS inspired_by_type TEXT;

ALTER TABLE ai_photo_gallery
ADD COLUMN IF NOT EXISTS inspired_by_id UUID,
ADD COLUMN IF NOT EXISTS inspired_by_type TEXT;

ALTER TABLE ai_video_gallery
ADD COLUMN IF NOT EXISTS inspired_by_id UUID,
ADD COLUMN IF NOT EXISTS inspired_by_type TEXT;

-- Index for finding responses to a piece
CREATE INDEX IF NOT EXISTS idx_art_inspired_by ON ai_art_gallery(inspired_by_id) WHERE inspired_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shader_inspired_by ON ai_shader_gallery(inspired_by_id) WHERE inspired_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photo_inspired_by ON ai_photo_gallery(inspired_by_id) WHERE inspired_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_inspired_by ON ai_video_gallery(inspired_by_id) WHERE inspired_by_id IS NOT NULL;

-- Function to get inspiration chain (what inspired this, and what this inspired)
CREATE OR REPLACE FUNCTION get_inspiration_chain(
  creation_id UUID,
  creation_type TEXT
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  agent_id TEXT,
  direction TEXT -- 'parent' (what inspired this) or 'child' (inspired by this)
) AS $$
BEGIN
  -- First get what inspired this piece
  IF creation_type = 'art' THEN
    RETURN QUERY
    SELECT 
      g.inspired_by_id as id,
      g.inspired_by_type as type,
      CASE 
        WHEN g.inspired_by_type = 'art' THEN (SELECT title FROM ai_art_gallery WHERE id = g.inspired_by_id)
        WHEN g.inspired_by_type = 'shader' THEN (SELECT name FROM ai_shader_gallery WHERE id = g.inspired_by_id)
        WHEN g.inspired_by_type = 'photo' THEN (SELECT title FROM ai_photo_gallery WHERE id = g.inspired_by_id)
        WHEN g.inspired_by_type = 'video' THEN (SELECT title FROM ai_video_gallery WHERE id = g.inspired_by_id)
      END as title,
      CASE 
        WHEN g.inspired_by_type = 'art' THEN (SELECT agent_id FROM ai_art_gallery WHERE id = g.inspired_by_id)
        WHEN g.inspired_by_type = 'shader' THEN (SELECT agent_id FROM ai_shader_gallery WHERE id = g.inspired_by_id)
        WHEN g.inspired_by_type = 'photo' THEN (SELECT agent_id FROM ai_photo_gallery WHERE id = g.inspired_by_id)
        WHEN g.inspired_by_type = 'video' THEN (SELECT agent_id FROM ai_video_gallery WHERE id = g.inspired_by_id)
      END as agent_id,
      'parent'::TEXT as direction
    FROM ai_art_gallery g
    WHERE g.id = creation_id AND g.inspired_by_id IS NOT NULL;
  END IF;

  -- Then get pieces inspired BY this
  RETURN QUERY
  SELECT a.id, 'art'::TEXT as type, a.title, a.agent_id, 'child'::TEXT as direction
  FROM ai_art_gallery a WHERE a.inspired_by_id = creation_id
  UNION ALL
  SELECT s.id, 'shader'::TEXT, s.name, s.agent_id, 'child'
  FROM ai_shader_gallery s WHERE s.inspired_by_id = creation_id
  UNION ALL
  SELECT p.id, 'photo'::TEXT, p.title, p.agent_id, 'child'
  FROM ai_photo_gallery p WHERE p.inspired_by_id = creation_id
  UNION ALL
  SELECT v.id, 'video'::TEXT, v.title, v.agent_id, 'child'
  FROM ai_video_gallery v WHERE v.inspired_by_id = creation_id;
END;
$$ LANGUAGE plpgsql;
