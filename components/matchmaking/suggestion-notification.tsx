"use client"

import { Sparkles, X } from "lucide-react"

interface SuggestionNotificationProps {
  userCount: number
  matchScore: number
  onView: () => void
  onDismiss: () => void
}

export function SuggestionNotification({
  userCount,
  matchScore,
  onView,
  onDismiss,
}: SuggestionNotificationProps) {
  const matchPercentage = Math.round(matchScore * 100)

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-surface-1 border-2 border-accent rounded-xl shadow-2xl overflow-hidden animate-slide-in">
      <div className="relative bg-gradient-to-r from-accent/10 to-green-500/10 p-4">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-surface-2 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent rounded-lg">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              Perfect Match Found!
              <span className="px-2 py-0.5 bg-accent text-black text-xs font-bold rounded-full">
                {matchPercentage}%
              </span>
            </h3>
            <p className="text-sm text-muted-2 mb-3">
              {userCount} {userCount === 1 ? 'developer is' : 'developers are'} online and match your interests
            </p>
            <button
              onClick={onView}
              className="w-full px-4 py-2 bg-accent hover:bg-accent text-black font-bold rounded-lg transition-colors text-sm"
            >
              View Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
