import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin/permissions-server'
import { formatDistanceToNow } from 'date-fns'
import { logger } from '@/lib/logger'

interface ActivityItem {
  id: string
  type: 'user_joined' | 'session_started' | 'room_created'
  message: string
  timestamp: string
  created_at: string
}

interface RecentUser {
  username: string
  created_at: string
}

interface RecentSession {
  id: string
  title: string
  created_at: string
  host?: {
    username: string
  } | null
}

interface RecentRoom {
  name: string
  created_at: string
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const supabase = createRouteHandlerClient({ cookies })

  try {
    const activity: ActivityItem[] = []

    // Recent user signups
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('username, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<RecentUser[]>()

    recentUsers?.forEach((user) => {
      activity.push({
        id: `user_${user.username}`,
        type: 'user_joined',
        message: `@${user.username} joined the platform`,
        timestamp: formatDistanceToNow(new Date(user.created_at), {
          addSuffix: true,
        }),
        created_at: user.created_at,
      })
    })

    // Recent sessions
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('id, title, created_at, host:profiles!sessions_host_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<RecentSession[]>()

    recentSessions?.forEach((session) => {
      activity.push({
        id: `session_${session.id}`,
        type: 'session_started',
        message: `${session.host?.username} started "${session.title}"`,
        timestamp: formatDistanceToNow(new Date(session.created_at), {
          addSuffix: true,
        }),
        created_at: session.created_at,
      })
    })

    // Recent community rooms
    const { data: recentRooms } = await supabase
      .from('community_rooms')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<RecentRoom[]>()

    recentRooms?.forEach((room) => {
      activity.push({
        id: `room_${room.name}`,
        type: 'room_created',
        message: `Community room "${room.name}" was created`,
        timestamp: formatDistanceToNow(new Date(room.created_at), {
          addSuffix: true,
        }),
        created_at: room.created_at,
      })
    })

    // Sort by date and limit to 10
    activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(activity.slice(0, 10))
  } catch (error) {
    logger.error('Failed to fetch activity', { error })
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
