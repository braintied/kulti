import { Coins, Video, Eye, Trophy } from "lucide-react"
import { Profile, UserProfileStats } from "@/types/database"
import { formatCredits } from "@/lib/credits/config"

interface ProfileStatsProps {
  profile: Profile
  stats: UserProfileStats | null
}

export function ProfileStats({ profile, stats }: ProfileStatsProps) {
  const statsData = stats || {
    sessions_attended: 0,
    sessions_hosted: 0,
    total_watch_hours: 0,
    milestones_achieved: 0,
  }

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Total Earned */}
      <div className="bg-surface-1 border border-border-default hover:border-accent rounded-xl p-6 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Coins className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-sm font-medium text-muted-2">Credits Earned</h3>
        </div>
        <p className="font-mono text-3xl font-bold text-accent">
          {formatCredits(profile.total_credits_earned || 0)}
        </p>
      </div>

      {/* Sessions Hosted */}
      <div className="bg-surface-1 border border-border-default hover:border-purple-500 rounded-xl p-6 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Video className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-sm font-medium text-muted-2">Sessions Hosted</h3>
        </div>
        <p className="font-mono text-3xl font-bold text-purple-500">
          {statsData.sessions_hosted}
        </p>
      </div>

      {/* Sessions Attended */}
      <div className="bg-surface-1 border border-border-default hover:border-blue-500 rounded-xl p-6 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-muted-2">Sessions Attended</h3>
        </div>
        <p className="font-mono text-3xl font-bold text-blue-500">
          {statsData.sessions_attended}
        </p>
        <p className="text-xs text-muted-3 mt-2">
          {Math.round(statsData.total_watch_hours)} hours watched
        </p>
      </div>

      {/* Milestones */}
      <div className="bg-surface-1 border border-border-default hover:border-yellow-500 rounded-xl p-6 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-sm font-medium text-muted-2">Milestones</h3>
        </div>
        <p className="font-mono text-3xl font-bold text-yellow-500">
          {statsData.milestones_achieved}
        </p>
      </div>
    </div>
  )
}
