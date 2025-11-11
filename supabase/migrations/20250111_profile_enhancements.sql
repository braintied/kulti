/**
 * Profile Enhancements
 *
 * Adds support for badges, streak tracking, and profile customization
 */

-- Add badges column for achievement tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Add streak tracking columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- Create index for badge queries
CREATE INDEX IF NOT EXISTS idx_profiles_badges
ON profiles USING GIN (badges);

-- Add comments for documentation
COMMENT ON COLUMN profiles.badges IS 'Array of badge objects: [{"badge_id": "first_stream", "awarded_at": "2025-01-11T..."}]';
COMMENT ON COLUMN profiles.current_streak IS 'Current consecutive days with session activity';
COMMENT ON COLUMN profiles.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN profiles.last_active_date IS 'Last date user participated in a session';
