import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin/permissions-server'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface SessionUpdateRequest {
  featured_rank?: number
  status?: 'scheduled' | 'live' | 'ended'
  ended_at?: string
}

interface SessionUpdateData {
  featured_rank?: number
  status?: 'scheduled' | 'live' | 'ended'
  ended_at?: string
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const supabase = createRouteHandlerClient({ cookies })
  const { id } = await params

  try {
    const body: SessionUpdateRequest = await request.json()
    const { featured_rank, status, ended_at } = body

    const updateData: SessionUpdateData = {}
    if (typeof featured_rank === 'number') updateData.featured_rank = featured_rank
    if (status) updateData.status = status
    if (ended_at) updateData.ended_at = ended_at

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Failed to update session', { error, sessionId: id })
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const supabase = createRouteHandlerClient({ cookies })
  const { id } = await params

  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete session', { error, sessionId: id })
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
