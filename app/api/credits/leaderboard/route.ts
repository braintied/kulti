/**
 * Credits Leaderboard API
 *
 * Get top users by total credits earned
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get top users by total credits earned
    const { data: topUsers, error: topUsersError } = await supabase
      .from('profiles')
      .select('id, username, display_name, total_credits_earned')
      .order('total_credits_earned', { ascending: false })
      .limit(limit)

    if (topUsersError) {
      throw topUsersError
    }

    // Add rank to each entry
    const leaderboard = (topUsers || []).map((user, index) => ({
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      total_credits_earned: user.total_credits_earned,
      rank: index + 1,
    }))

    // Get current user's rank
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('id, username, display_name, total_credits_earned')
      .eq('id', user.id)
      .single()

    let currentUserRank = null
    if (currentUserProfile) {
      // Count how many users have more credits than current user
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('total_credits_earned', currentUserProfile.total_credits_earned)

      const rank = (count || 0) + 1

      currentUserRank = {
        user_id: currentUserProfile.id,
        username: currentUserProfile.username,
        display_name: currentUserProfile.display_name,
        total_credits_earned: currentUserProfile.total_credits_earned,
        rank,
      }
    }

    return NextResponse.json({
      leaderboard,
      current_user_rank: currentUserRank,
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    )
  }
}
