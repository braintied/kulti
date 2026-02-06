'use client'

/**
 * Badge Notifications
 *
 * Toast notifications for badge and streak events
 */

import toast from 'react-hot-toast'
import { BADGE_INFO } from './constants'
import { logger } from '@/lib/logger'

/**
 * Show notification when a badge is earned
 */
export function notifyBadgeEarned(badgeId: string) {
  const badge = BADGE_INFO[badgeId]

  if (!badge) {
    logger.warn(`Unknown badge: ${badgeId}`)
    return
  }

  toast.success(
    (t) => (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <span className="text-sm font-mono font-bold text-yellow-400">+1</span>
        </div>
        <div>
          <p className="font-bold text-sm">Badge Earned!</p>
          <p className="text-xs text-muted-3">{badge.name}</p>
        </div>
      </div>
    ),
    {
      duration: 4000,
      className: 'bg-surface-1 text-white border border-border-default',
    }
  )
}

/**
 * Show notification for streak continuation
 */
export function notifyStreakContinued(streakDays: number) {
  const flame_count = streakDays >= 100 ? 3 : streakDays >= 30 ? 2 : 1

  toast.success(
    (t) => (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="text-sm font-mono text-orange-400">{flame_count}x</span>
        </div>
        <div>
          <p className="font-bold text-sm">{streakDays} Day Streak!</p>
          <p className="text-xs text-muted-3">Keep it up!</p>
        </div>
      </div>
    ),
    {
      duration: 3000,
      className: 'bg-surface-1 text-white border border-orange-500/30',
    }
  )
}

/**
 * Show notification when streak milestone is hit
 */
export function notifyStreakMilestone(streakDays: number, creditsEarned: number) {
  toast.success(
    (t) => (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-sm font-mono font-bold text-white">{streakDays}d</span>
        </div>
        <div>
          <p className="font-bold text-sm">{streakDays} Day Streak Milestone!</p>
          <p className="text-xs text-accent font-mono">+{creditsEarned} credits</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      className: 'bg-surface-1 text-white border border-orange-500/30',
    }
  )
}

/**
 * Show notification when streak is broken
 */
export function notifyStreakBroken(previousStreak: number) {
  if (previousStreak > 1) {
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-sm font-mono text-red-400">x</span>
          </div>
          <div>
            <p className="font-bold text-sm">Streak Reset</p>
            <p className="text-xs text-muted-3">
              Your {previousStreak} day streak ended. Start a new one today!
            </p>
          </div>
        </div>
      ),
      {
        duration: 4000,
        className: 'bg-surface-1 text-white border border-border-default',
      }
    )
  }
}
