import { NextRequest, NextResponse } from 'next/server'
import { requireModerator } from '@/lib/admin/permissions-server'
import {
  getInviteAnalytics,
  deactivateInvite,
  reactivateInvite,
} from '@/lib/invites/service'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireModerator(request)
  if (authError) return authError

  const { id } = await context.params

  try {
    const analytics = await getInviteAnalytics(id)

    if (!analytics) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    logger.error('Get invite analytics error', { error, inviteId: id })
    return NextResponse.json(
      { error: 'Failed to get invite analytics' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireModerator(request)
  if (authError) return authError

  const { id } = await context.params

  try {
    const body = await request.json()
    const { action } = body

    let success = false

    if (action === 'deactivate') {
      success = await deactivateInvite(id)
    } else if (action === 'reactivate') {
      success = await reactivateInvite(id)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update invite' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Update invite error', { error, inviteId: id })
    return NextResponse.json(
      { error: 'Failed to update invite' },
      { status: 500 }
    )
  }
}
