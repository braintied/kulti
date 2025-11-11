import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from './client'

export async function getProfile(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function getSession(sessionId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      host:profiles!host_id(*)
    `)
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function getLiveSessions() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      host:profiles!host_id(*),
      participants:session_participants(count)
    `)
    .eq('status', 'live')
    .eq('is_public', true)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSessionByRoomCode(roomCode: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      host:profiles!host_id(*)
    `)
    .eq('room_code', roomCode)
    .single()

  if (error) throw error
  return data
}
