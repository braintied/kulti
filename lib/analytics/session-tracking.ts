/**
 * Session Analytics Tracking
 *
 * Utilities for tracking user activity during sessions
 * and calculating credits based on engagement.
 */

import { createClient } from '@/lib/supabase/server'
import {
  calculateWatchingCredits,
  calculateHostingCredits,
  MIN_SESSION_DURATION_FOR_BONUS,
  HIGH_ENGAGEMENT_THRESHOLD,
} from '@/lib/credits/config'

export interface SessionStats {
  sessionId: string
  duration_seconds: number
  total_participants: number
  avg_concurrent_viewers: number
  total_chat_messages: number
  engagement_score: number
  completed: boolean
}

export interface ParticipantStats {
  userId: string
  sessionId: string
  role: 'host' | 'presenter' | 'viewer'
  watch_duration_seconds: number
  chat_messages_count: number
  helped_others_count: number
  was_active: boolean
}

/**
 * Update heartbeat for a participant
 * Called every 30 seconds while user is active
 */
export async function updateHeartbeat(
  sessionId: string,
  userId: string
): Promise<{ watch_duration_seconds: number; estimated_credits: number }> {
  const supabase = await createClient()

  // Get current participant record
  const { data: participant } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!participant) {
    throw new Error('Participant not found')
  }

  // Calculate time since last heartbeat (or joined_at if first heartbeat)
  const lastTime = participant.last_heartbeat_at
    ? new Date(participant.last_heartbeat_at).getTime()
    : new Date(participant.joined_at).getTime()
  const now = Date.now()
  const secondsSinceLastBeat = Math.floor((now - lastTime) / 1000)

  // Cap at reasonable amount (max 2 minutes) to prevent abuse
  const secondsToAdd = Math.min(secondsSinceLastBeat, 120)

  // Update the record
  const { data: updated } = await supabase
    .from('session_participants')
    .update({
      watch_duration_seconds: participant.watch_duration_seconds + secondsToAdd,
      last_heartbeat_at: new Date().toISOString(),
      is_active: true,
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .select('watch_duration_seconds')
    .single()

  const newDuration = updated?.watch_duration_seconds || 0

  // Estimate credits (this is approximate, real calculation happens at session end)
  const estimatedCredits = participant.role === 'host'
    ? Math.floor((newDuration / 60) * 5) // Rough estimate for host
    : Math.floor((newDuration / 60) * 1) // Rough estimate for viewer

  return {
    watch_duration_seconds: newDuration,
    estimated_credits: estimatedCredits,
  }
}

/**
 * Mark participant as inactive
 * Called when user leaves or becomes inactive
 */
export async function markInactive(sessionId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('session_participants')
    .update({ is_active: false })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
}

/**
 * Get current session statistics
 */
export async function getSessionStats(sessionId: string): Promise<SessionStats | null> {
  const supabase = await createClient()

  // Get session
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return null
  }

  // Get participants
  const { data: participants } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)

  if (!participants) {
    return null
  }

  // Calculate stats
  const duration_seconds = session.started_at
    ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
    : 0

  const total_participants = participants.length

  // Calculate average concurrent viewers (viewers currently active)
  const currentActiveViewers = participants.filter(p => p.is_active && p.role !== 'host').length

  // Get chat messages count
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const total_chat_messages = totalMessages || 0

  // Calculate engagement score (messages per minute per viewer)
  const durationMinutes = duration_seconds / 60
  const engagement_score = durationMinutes > 0
    ? (total_chat_messages / durationMinutes) / Math.max(currentActiveViewers, 1)
    : 0

  const completed = session.status === 'ended'

  return {
    sessionId,
    duration_seconds,
    total_participants,
    avg_concurrent_viewers: currentActiveViewers,
    total_chat_messages,
    engagement_score,
    completed,
  }
}

/**
 * Get participant statistics
 */
export async function getParticipantStats(
  sessionId: string,
  userId: string
): Promise<ParticipantStats | null> {
  const supabase = await createClient()

  const { data: participant } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!participant) {
    return null
  }

  return {
    userId: participant.user_id,
    sessionId: participant.session_id,
    role: participant.role,
    watch_duration_seconds: participant.watch_duration_seconds || 0,
    chat_messages_count: participant.chat_messages_count || 0,
    helped_others_count: participant.helped_others_count || 0,
    was_active: participant.is_active || false,
  }
}

/**
 * Calculate credits for a viewer based on their activity
 */
export async function calculateViewerCredits(
  sessionId: string,
  userId: string
): Promise<number> {
  const participant = await getParticipantStats(sessionId, userId)
  if (!participant || participant.role === 'host') {
    return 0
  }

  // Get session stats to check if they're a repeat viewer
  const supabase = await createClient()
  const { data: session } = await supabase
    .from('sessions')
    .select('host_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return 0
  }

  // Check if repeat viewer (attended 3+ sessions from this host)
  const { count: previousSessions } = await supabase
    .from('session_participants')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('session_id', sessionId)
    .in('role', ['viewer', 'presenter'])

  const isRepeatViewer = (previousSessions || 0) >= 3

  // Check if first session ever
  const { count: totalSessions } = await supabase
    .from('session_participants')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const isNewDiscovery = (totalSessions || 0) === 1

  const credits = calculateWatchingCredits({
    durationSeconds: participant.watch_duration_seconds,
    wasActivelyChatting: participant.chat_messages_count > 0,
    helpedOthers: participant.helped_others_count > 0,
    isRepeatViewer,
    isNewDiscovery,
  })

  return credits
}

/**
 * Calculate credits for the host based on session performance
 */
export async function calculateHostCredits(sessionId: string): Promise<number> {
  const sessionStats = await getSessionStats(sessionId)
  if (!sessionStats) {
    return 0
  }

  const supabase = await createClient()

  // Get host participant record
  const { data: hostParticipant } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .eq('role', 'host')
    .single()

  if (!hostParticipant) {
    return 0
  }

  const completedFullSession =
    sessionStats.completed &&
    sessionStats.duration_seconds >= MIN_SESSION_DURATION_FOR_BONUS

  const credits = calculateHostingCredits({
    durationSeconds: hostParticipant.watch_duration_seconds,
    avgConcurrentViewers: sessionStats.avg_concurrent_viewers,
    totalChatMessages: sessionStats.total_chat_messages,
    peopleHelped: hostParticipant.helped_others_count || 0,
    completedFullSession,
  })

  return credits
}

/**
 * Check if user has been active recently
 * Used to detect if user has left/tabbed away
 */
export async function isUserActive(sessionId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: participant } = await supabase
    .from('session_participants')
    .select('last_heartbeat_at, is_active')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!participant || !participant.is_active) {
    return false
  }

  if (!participant.last_heartbeat_at) {
    return true // Just joined, consider active
  }

  // Check if last heartbeat was within 2 minutes
  const lastBeat = new Date(participant.last_heartbeat_at).getTime()
  const now = Date.now()
  const minutesSinceLastBeat = (now - lastBeat) / (1000 * 60)

  return minutesSinceLastBeat < 2
}

/**
 * Increment chat message count for a participant
 */
export async function incrementChatCount(sessionId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc('increment', {
    table_name: 'session_participants',
    column_name: 'chat_messages_count',
    row_id: `session_id=${sessionId},user_id=${userId}`,
  })

  // Also increment session total
  await supabase
    .from('sessions')
    .update({
      total_chat_messages: supabase.sql`total_chat_messages + 1`,
    })
    .eq('id', sessionId)
}

/**
 * Mark that a user helped someone
 */
export async function incrementHelpedCount(sessionId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('session_participants')
    .update({
      helped_others_count: supabase.sql`helped_others_count + 1`,
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
}
