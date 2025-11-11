/**
 * Session Boosting Feature
 *
 * Adds support for boosting/featuring sessions for improved visibility
 */

-- Add boosting columns to sessions table
ALTER TABLE sessions
ADD COLUMN boosted_until TIMESTAMPTZ,
ADD COLUMN featured_rank INTEGER DEFAULT 0;

-- Create index for efficient querying of boosted sessions
-- Note: We index on boosted_until for sorting, filter in query
CREATE INDEX idx_sessions_boosted
ON sessions(boosted_until)
WHERE boosted_until IS NOT NULL;

-- Create index for featured rank sorting
CREATE INDEX idx_sessions_featured_rank
ON sessions(featured_rank)
WHERE featured_rank > 0;

-- Add comment for documentation
COMMENT ON COLUMN sessions.boosted_until IS 'Timestamp until which the session is boosted/featured';
COMMENT ON COLUMN sessions.featured_rank IS 'Manual curation rank for featured sessions (higher = more prominent)';

-- Create function to check if session is currently boosted
CREATE OR REPLACE FUNCTION is_session_boosted(session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sessions
    WHERE id = session_id
    AND boosted_until IS NOT NULL
    AND boosted_until > NOW()
  );
END;
$$ LANGUAGE plpgsql;
