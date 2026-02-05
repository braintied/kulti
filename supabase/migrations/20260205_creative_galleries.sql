-- Creative galleries for Video, Shader, and Photo types
-- Part of the multi-creative-type system for Kulti

-- Video Gallery
CREATE TABLE IF NOT EXISTS ai_video_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- seconds
  model TEXT,
  prompt TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_gallery_agent ON ai_video_gallery(agent_id);
CREATE INDEX IF NOT EXISTS idx_video_gallery_created ON ai_video_gallery(created_at DESC);

-- Shader Gallery (with actual GLSL code!)
CREATE TABLE IF NOT EXISTS ai_shader_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fragment_shader TEXT NOT NULL,
  vertex_shader TEXT,
  thumbnail_url TEXT,
  uniforms JSONB, -- custom uniform definitions
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shader_gallery_agent ON ai_shader_gallery(agent_id);
CREATE INDEX IF NOT EXISTS idx_shader_gallery_created ON ai_shader_gallery(created_at DESC);

-- Photo Gallery
CREATE TABLE IF NOT EXISTS ai_photo_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  original_url TEXT, -- before edits
  thumbnail_url TEXT,
  collection TEXT, -- grouping
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB DEFAULT '{}', -- camera, lens, aperture, etc.
  edit_process JSONB, -- steps taken during editing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_gallery_agent ON ai_photo_gallery(agent_id);
CREATE INDEX IF NOT EXISTS idx_photo_gallery_created ON ai_photo_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_gallery_collection ON ai_photo_gallery(collection);

-- RPC functions for incrementing likes (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_video_likes(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ai_video_gallery SET likes = likes + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_shader_likes(shader_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ai_shader_gallery SET likes = likes + 1 WHERE id = shader_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_photo_likes(photo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ai_photo_gallery SET likes = likes + 1 WHERE id = photo_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE ai_video_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_shader_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_photo_gallery ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read video gallery" ON ai_video_gallery
  FOR SELECT USING (true);

CREATE POLICY "Public read shader gallery" ON ai_shader_gallery
  FOR SELECT USING (true);

CREATE POLICY "Public read photo gallery" ON ai_photo_gallery
  FOR SELECT USING (true);

-- Service role can insert/update
CREATE POLICY "Service can insert video" ON ai_video_gallery
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can insert shader" ON ai_shader_gallery
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can insert photo" ON ai_photo_gallery
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update video" ON ai_video_gallery
  FOR UPDATE USING (true);

CREATE POLICY "Service can update shader" ON ai_shader_gallery
  FOR UPDATE USING (true);

CREATE POLICY "Service can update photo" ON ai_photo_gallery
  FOR UPDATE USING (true);
