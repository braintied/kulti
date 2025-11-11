-- Credits System Migration
-- This migration adds the credits/tokenomics infrastructure to Kulti

-- ============================================================================
-- 1. Add credit tracking columns to profiles table
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0 CHECK (credits_balance >= 0),
ADD COLUMN IF NOT EXISTS total_credits_earned INTEGER DEFAULT 0 CHECK (total_credits_earned >= 0),
ADD COLUMN IF NOT EXISTS total_credits_spent INTEGER DEFAULT 0 CHECK (total_credits_spent >= 0),
ADD COLUMN IF NOT EXISTS credits_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for querying top credit holders
CREATE INDEX IF NOT EXISTS idx_profiles_credits_balance ON profiles(credits_balance DESC);

-- ============================================================================
-- 2. Create credit_transactions table for transaction history
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Positive for earned, negative for spent
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  type TEXT NOT NULL CHECK (type IN (
    'earned_watching',
    'earned_hosting',
    'earned_chatting',
    'earned_helping',
    'bonus_milestone',
    'bonus_completion',
    'bonus_first_session',
    'spent_feature',
    'spent_tipping',
    'spent_priority_join',
    'spent_recording',
    'admin_adjustment'
  )),
  source_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_session_id ON credit_transactions(source_session_id);

-- ============================================================================
-- 3. Add session tracking columns to session_participants table
-- ============================================================================

ALTER TABLE session_participants
ADD COLUMN IF NOT EXISTS watch_duration_seconds INTEGER DEFAULT 0 CHECK (watch_duration_seconds >= 0),
ADD COLUMN IF NOT EXISTS credits_earned INTEGER DEFAULT 0 CHECK (credits_earned >= 0),
ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS chat_messages_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS helped_others_count INTEGER DEFAULT 0;

-- Index for finding active participants
CREATE INDEX IF NOT EXISTS idx_session_participants_active ON session_participants(session_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_session_participants_heartbeat ON session_participants(last_heartbeat_at);

-- ============================================================================
-- 4. Add credit tracking columns to sessions table
-- ============================================================================

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS total_credits_distributed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_calculated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS avg_concurrent_viewers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chat_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(3,2) DEFAULT 0.0;

-- ============================================================================
-- 5. Create credit_milestones table for tracking milestone bonuses
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'first_session',
    'sessions_attended_10',
    'sessions_attended_50',
    'sessions_attended_100',
    'hours_watched_10',
    'hours_watched_50',
    'hours_watched_100',
    'first_stream',
    'sessions_hosted_10',
    'sessions_hosted_50',
    'hours_streamed_10',
    'hours_streamed_50',
    'first_regular_viewer',
    'regular_viewers_10'
  )),
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  credits_awarded INTEGER NOT NULL,
  UNIQUE(user_id, milestone_type)
);

CREATE INDEX IF NOT EXISTS idx_credit_milestones_user_id ON credit_milestones(user_id);

-- ============================================================================
-- 6. Create function to add credits (with transaction safety)
-- ============================================================================

CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_source_session_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Update profile balance
  UPDATE profiles
  SET
    credits_balance = credits_balance + p_amount,
    total_credits_earned = CASE WHEN p_amount > 0 THEN total_credits_earned + p_amount ELSE total_credits_earned END,
    total_credits_spent = CASE WHEN p_amount < 0 THEN total_credits_spent + ABS(p_amount) ELSE total_credits_spent END,
    credits_updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    source_session_id,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    p_type,
    p_source_session_id,
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Create function to check and award milestones
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_award_milestones(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_sessions_attended INTEGER;
  v_sessions_hosted INTEGER;
  v_hours_watched DECIMAL;
  v_hours_streamed DECIMAL;
  v_milestones_awarded JSONB := '[]'::jsonb;
  v_milestone_record RECORD;
BEGIN
  -- Get user stats
  SELECT
    COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role IN ('viewer', 'presenter')) as attended,
    COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role = 'host') as hosted,
    COALESCE(SUM(sp.watch_duration_seconds) FILTER (WHERE sp.role IN ('viewer', 'presenter')), 0) / 3600.0 as watched_hours,
    COALESCE(SUM(sp.watch_duration_seconds) FILTER (WHERE sp.role = 'host'), 0) / 3600.0 as streamed_hours
  INTO v_sessions_attended, v_sessions_hosted, v_hours_watched, v_hours_streamed
  FROM session_participants sp
  WHERE sp.user_id = p_user_id;

  -- Check and award milestones (only if not already awarded)
  FOR v_milestone_record IN
    SELECT * FROM (VALUES
      ('sessions_attended_10', 10, v_sessions_attended >= 10, 500),
      ('sessions_attended_50', 50, v_sessions_attended >= 50, 2500),
      ('sessions_attended_100', 100, v_sessions_attended >= 100, 10000),
      ('hours_watched_10', 10, v_hours_watched >= 10, 1000),
      ('hours_watched_50', 50, v_hours_watched >= 50, 5000),
      ('hours_watched_100', 100, v_hours_watched >= 100, 15000),
      ('sessions_hosted_10', 10, v_sessions_hosted >= 10, 1000),
      ('sessions_hosted_50', 50, v_sessions_hosted >= 50, 5000),
      ('hours_streamed_10', 10, v_hours_streamed >= 10, 2000),
      ('hours_streamed_50', 50, v_hours_streamed >= 50, 10000)
    ) AS milestones(milestone_type, threshold, is_achieved, credits_reward)
    WHERE is_achieved = true
  LOOP
    -- Try to insert milestone (will fail silently if already exists due to UNIQUE constraint)
    BEGIN
      INSERT INTO credit_milestones (user_id, milestone_type, credits_awarded)
      VALUES (p_user_id, v_milestone_record.milestone_type, v_milestone_record.credits_reward);

      -- If insert succeeded, award the credits
      PERFORM add_credits(
        p_user_id,
        v_milestone_record.credits_reward,
        'bonus_milestone',
        NULL,
        jsonb_build_object('milestone', v_milestone_record.milestone_type)
      );

      -- Add to awarded list
      v_milestones_awarded := v_milestones_awarded || jsonb_build_object(
        'milestone', v_milestone_record.milestone_type,
        'credits', v_milestone_record.credits_reward
      );
    EXCEPTION WHEN unique_violation THEN
      -- Milestone already awarded, skip
      CONTINUE;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'milestones_awarded', v_milestones_awarded,
    'count', jsonb_array_length(v_milestones_awarded)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Enable Row Level Security (RLS) on new tables
-- ============================================================================

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_milestones ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can view their own milestones
CREATE POLICY "Users can view own milestones"
  ON credit_milestones FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Only system (service role) can insert/update credits
-- This will be done via API routes with service role client

-- ============================================================================
-- 9. Create view for user credit stats
-- ============================================================================

CREATE OR REPLACE VIEW user_credit_stats AS
SELECT
  p.id as user_id,
  p.username,
  p.display_name,
  p.credits_balance,
  p.total_credits_earned,
  p.total_credits_spent,
  COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role IN ('viewer', 'presenter')) as sessions_attended,
  COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role = 'host') as sessions_hosted,
  COALESCE(SUM(sp.watch_duration_seconds) FILTER (WHERE sp.role IN ('viewer', 'presenter')), 0) / 3600.0 as total_hours_watched,
  COALESCE(SUM(sp.watch_duration_seconds) FILTER (WHERE sp.role = 'host'), 0) / 3600.0 as total_hours_streamed,
  COUNT(DISTINCT m.milestone_type) as milestones_achieved,
  p.credits_updated_at
FROM profiles p
LEFT JOIN session_participants sp ON sp.user_id = p.id
LEFT JOIN credit_milestones m ON m.user_id = p.id
GROUP BY p.id, p.username, p.display_name, p.credits_balance, p.total_credits_earned, p.total_credits_spent, p.credits_updated_at;

-- ============================================================================
-- 10. Create indexes for leaderboards
-- ============================================================================

-- Top earners
CREATE INDEX IF NOT EXISTS idx_profiles_total_earned ON profiles(total_credits_earned DESC);

-- Most active watchers
CREATE INDEX IF NOT EXISTS idx_session_participants_watch_duration ON session_participants(watch_duration_seconds DESC);

COMMENT ON TABLE credit_transactions IS 'Stores all credit transactions (earned and spent) for complete audit trail';
COMMENT ON TABLE credit_milestones IS 'Tracks milestone achievements and prevents duplicate bonuses';
COMMENT ON FUNCTION add_credits IS 'Safely adds/deducts credits with automatic transaction logging';
COMMENT ON FUNCTION check_and_award_milestones IS 'Checks user progress and awards milestone bonuses';
COMMENT ON VIEW user_credit_stats IS 'Consolidated view of user credit statistics and activity';
