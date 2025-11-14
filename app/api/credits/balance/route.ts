/**
 * Credits Balance API
 *
 * Get user's current credit balance and stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance, getUserStats } from '@/lib/credits'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get balance
    const balance = await getBalance(user.id)

    if (!balance) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get detailed stats (optional, based on query param)
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    let stats = null
    if (includeStats) {
      stats = await getUserStats(user.id)
    }

    return NextResponse.json({
      ...balance,
      stats,
    })
  } catch (error) {
    logger.error('Get balance error', { error })
    return NextResponse.json(
      { error: 'Failed to get balance' },
      { status: 500 }
    )
  }
}
