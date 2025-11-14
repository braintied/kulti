import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserInvites } from '@/lib/invites/service'
import { logger } from '@/lib/logger'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invites = await getUserInvites(user.id)
    return NextResponse.json(invites)
  } catch (error) {
    logger.error('Get my codes error', { error })
    return NextResponse.json(
      { error: 'Failed to get codes' },
      { status: 500 }
    )
  }
}
