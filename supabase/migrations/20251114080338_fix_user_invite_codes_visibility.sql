-- Fix invite codes visibility for users
-- Users should be able to see ALL invite codes they created, regardless of active status

-- Add policy to allow users to view their own created invite codes
CREATE POLICY "invites_select_own_codes"
  ON invites FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- This policy works alongside the existing invites_select_auth_policy:
-- - Users can validate active invites (existing policy)
-- - Users can see ALL their own invite codes (this policy)
-- - Admins can see all invites (existing policy via is_admin())
