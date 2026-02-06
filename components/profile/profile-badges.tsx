import { Star, Trophy, Award, Medal, type LucideIcon } from "lucide-react"

interface Badge {
  badge_id: string
  awarded_at: string
}

interface ProfileBadgesProps {
  badges: Badge[]
}

const BADGE_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  first_stream: { label: "First Stream", icon: Star, color: "lime" },
  first_session: { label: "First Session", icon: Star, color: "lime" },
  sessions_10: { label: "10 Sessions", icon: Medal, color: "blue" },
  sessions_50: { label: "50 Sessions", icon: Trophy, color: "purple" },
  sessions_100: { label: "100 Sessions", icon: Trophy, color: "yellow" },
  hosted_10: { label: "10 Streams", icon: Medal, color: "blue" },
  hosted_50: { label: "50 Streams", icon: Trophy, color: "purple" },
  hours_watched_100: { label: "100 Hours", icon: Trophy, color: "yellow" },
  credits_earned_10k: { label: "10K Credits", icon: Award, color: "lime" },
  credits_earned_100k: { label: "100K Credits", icon: Trophy, color: "yellow" },
}

export function ProfileBadges({ badges }: ProfileBadgesProps) {
  if (!badges || badges.length === 0) {
    return (
      <div className="bg-surface-1 border border-border-default rounded-xl p-8">
        <h2 className="font-mono text-2xl font-bold mb-6">Badges</h2>
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-muted-2 mx-auto mb-4" />
          <p className="text-muted-2">No badges yet</p>
          <p className="text-sm text-muted-3 mt-2">
            Earn badges by completing milestones
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 border border-border-default rounded-xl p-8">
      <h2 className="font-mono text-2xl font-bold mb-6">
        Badges
        <span className="ml-3 text-lg text-muted-2">({badges.length})</span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badges.map((badge) => {
          const config = BADGE_CONFIG[badge.badge_id]
          if (!config) return null

          const Icon = config.icon
          const colorClass = {
            lime: "bg-accent/10 border-accent/50 text-accent",
            blue: "bg-blue-500/10 border-blue-500/50 text-blue-500",
            purple: "bg-purple-500/10 border-purple-500/50 text-purple-500",
            yellow: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500",
          }[config.color] || "bg-accent/10 border-accent/50 text-accent"

          return (
            <div
              key={badge.badge_id}
              className={`group relative border rounded-xl p-4 transition-all hover:scale-105 cursor-pointer ${colorClass}`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="w-8 h-8" />
                <p className="text-xs font-bold text-center">{config.label}</p>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-1 border border-border-default rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Earned {new Date(badge.awarded_at).toLocaleDateString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
