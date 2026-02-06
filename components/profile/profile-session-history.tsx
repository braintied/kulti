import { Clock, Coins, Video } from "lucide-react"
import { formatCredits } from "@/lib/credits/config"
import Link from "next/link"
import { SessionParticipantWithDetails } from "@/types/database"

interface ProfileSessionHistoryProps {
  sessions: SessionParticipantWithDetails[]
  profileUsername: string
}

export function ProfileSessionHistory({
  sessions,
  profileUsername,
}: ProfileSessionHistoryProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-surface-1 border border-border-default rounded-xl p-8">
        <h2 className="font-mono text-2xl font-bold mb-6">Session History</h2>
        <div className="text-center py-8">
          <Video className="w-12 h-12 text-muted-2 mx-auto mb-4" />
          <p className="text-muted-2">No sessions yet</p>
          <p className="text-sm text-muted-3 mt-2">
            Session history will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 border border-border-default rounded-xl p-8">
      <h2 className="font-mono text-2xl font-bold mb-6">Recent Sessions</h2>

      <div className="space-y-3">
        {sessions.map((participant) => {
          const session = participant.sessions
          if (!session) return null

          const isHost = participant.role === "host"
          const durationMinutes = Math.floor(
            (participant.watch_duration_seconds || 0) / 60
          )

          return (
            <div
              key={participant.session_id}
              className="p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {isHost && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-500 text-xs font-bold rounded">
                        HOST
                      </span>
                    )}
                    <h3 className="font-medium truncate">{session.title}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-3">
                    {!isHost && session.host && (
                      <span>by @{session.host.username}</span>
                    )}
                    {session.started_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(session.started_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {durationMinutes > 0 && (
                      <span>{durationMinutes} min</span>
                    )}
                  </div>
                </div>

                {/* Credits Earned */}
                {participant.credits_earned > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 rounded-lg">
                    <Coins className="w-4 h-4 text-accent" />
                    <span className="font-mono font-bold text-accent">
                      +{formatCredits(participant.credits_earned)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sessions.length >= 10 && (
        <div className="mt-6 text-center">
          <Link
            href={`/profile/${profileUsername}/history`}
            className="text-accent hover:text-accent font-medium"
          >
            View All Sessions →
          </Link>
        </div>
      )}
    </div>
  )
}
