/**
 * Credits Milestones API
 *
 * Get user's achieved milestones
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(_request: NextRequest) {
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

    // Get user's achieved milestones
    const { data: milestones, error } = await supabase
      .from('credit_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      milestones: milestones || [],
      count: milestones?.length || 0,
    })
  } catch (error) {
    logger.error('Get milestones error', { error })
    return NextResponse.json(
      { error: 'Failed to get milestones' },
      { status: 500 }
    )
  }
}
