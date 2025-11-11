export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_approved: boolean
  invite_code: string | null
  created_at: string
}

export type Session = {
  id: string
  room_code: string
  title: string
  description: string | null
  host_id: string
  hms_room_id: string | null
  status: 'scheduled' | 'live' | 'ended'
  is_public: boolean
  max_participants: number
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export type SessionParticipant = {
  id: string
  session_id: string
  user_id: string
  role: 'host' | 'presenter' | 'viewer'
  joined_at: string
}

export type Message = {
  id: string
  session_id: string
  user_id: string | null
  content: string
  type: 'text' | 'system' | 'ai'
  created_at: string
}

export type WaitlistEntry = {
  id: string
  email: string
  name: string
  twitter_handle: string | null
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  position: number | null
  created_at: string
}

export type Invite = {
  id: string
  code: string
  created_by: string | null
  used_by: string | null
  max_uses: number
  current_uses: number
  expires_at: string | null
  created_at: string
}
