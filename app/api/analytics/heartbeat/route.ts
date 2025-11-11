/**
 * Session Heartbeat API
 *
 * Updates user's active watch time and returns estimated credits.
 * Called every 30 seconds by the session room component.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateHeartbeat, markInactive } from '@/lib/analytics/session-tracking'

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { sessionId, isActive } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    // If user is inactive, mark them as such
    if (isActive === false) {
      await markInactive(sessionId, user.id)
      return NextResponse.json({
        success: true,
        message: 'Marked as inactive',
      })
    }

    // Update heartbeat
    const { watch_duration_seconds, estimated_credits } = await updateHeartbeat(
      sessionId,
      user.id
    )

    return NextResponse.json({
      success: true,
      watch_duration_seconds,
      estimated_credits,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json(
      { error: 'Failed to update heartbeat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
