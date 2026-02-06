"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Award } from "lucide-react"
import { formatCredits } from "@/lib/credits/config"
import Link from "next/link"
import { logger } from '@/lib/logger'

interface CreditsLeaderboardProps {
  currentUserId: string
}

interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string
  total_credits_earned: number
  rank: number
}

export function CreditsLeaderboard({ currentUserId }: CreditsLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`/api/credits/leaderboard?limit=10`)
        if (response.ok) {
          const data = await response.json()
          setLeaderboard(data.leaderboard)
          setCurrentUserRank(data.current_user_rank)
        }
      } catch (error) {
        logger.error("Failed to fetch leaderboard:", { error })
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [currentUserId])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-muted-3" />
      case 3:
        return <Award className="w-5 h-5 text-amber-700" />
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-3">
            {rank}
          </div>
        )
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-500/50"
      case 2:
        return "border-border-default/50"
      case 3:
        return "border-amber-700/50"
      default:
        return "border-border-default"
    }
  }

  if (loading) {
    return (
      <div className="bg-surface-1 border border-border-default rounded-xl p-6 animate-pulse">
        <h2 className="font-mono text-2xl font-bold mb-6">Leaderboard</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-surface-2 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 border border-border-default rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-accent" />
        <h2 className="font-mono text-2xl font-bold">Leaderboard</h2>
      </div>

      {/* Top 10 */}
      <div className="space-y-2">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.user_id === currentUserId

          return (
            <Link
              key={entry.user_id}
              href={`/profile/${entry.username}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors border ${
                isCurrentUser
                  ? "bg-accent/10 border-accent/50 hover:bg-accent/20"
                  : `bg-surface-2 hover:bg-surface-3 ${getRankColor(entry.rank)}`
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrentUser ? "text-accent" : ""}`}>
                  {entry.display_name}
                </p>
                <p className="text-xs text-muted-3 truncate">@{entry.username}</p>
              </div>

              {/* Credits */}
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-accent">
                  {formatCredits(entry.total_credits_earned)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Current User Rank (if not in top 10) */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <div className="mt-4 pt-4 border-t border-border-default">
          <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/50 rounded-lg">
            <div className="w-8 flex items-center justify-center">
              <div className="text-xs font-bold text-accent">
                {currentUserRank.rank}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-accent">Your Rank</p>
              <p className="text-xs text-muted-3">@{currentUserRank.username}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold text-accent">
                {formatCredits(currentUserRank.total_credits_earned)}
              </p>
            </div>
          </div>
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-muted-2 mx-auto mb-4" />
          <p className="text-muted-2">No rankings yet</p>
          <p className="text-sm text-muted-3 mt-2">
            Be the first to earn credits
          </p>
        </div>
      )}
    </div>
  )
}
