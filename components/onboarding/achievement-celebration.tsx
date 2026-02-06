"use client"

import { useEffect } from "react"
import { Award, Coins, Sparkles, X } from "lucide-react"
import confetti from "canvas-confetti"

interface Achievement {
  type: "badge" | "credits" | "milestone"
  title: string
  description: string
  credits?: number
}

interface AchievementCelebrationProps {
  achievement: Achievement
  isOpen: boolean
  onClose: () => void
}

export const AchievementCelebration = ({
  achievement,
  isOpen,
  onClose,
}: AchievementCelebrationProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a3e635", "#84cc16", "#65a30d"],
      })

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 3000)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = "unset"
      }
    } else {
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (achievement.type) {
      case "badge":
        return <Award className="w-16 h-16 text-accent" />
      case "credits":
        return <Coins className="w-16 h-16 text-accent" />
      case "milestone":
        return <Sparkles className="w-16 h-16 text-accent" />
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-labelledby="achievement-title"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-surface-1 via-surface-2 to-surface-1 border-2 border-accent/30 rounded-2xl shadow-2xl shadow-accent/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 rounded-2xl animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
          aria-label="Close celebration"
        >
          <X className="w-5 h-5 text-muted-2" />
        </button>

        {/* Content */}
        <div className="relative p-8 space-y-6 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-accent/10 border-2 border-accent/30 rounded-full animate-bounce">
              {getIcon()}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-accent uppercase tracking-wider">
              Achievement Unlocked!
            </div>
            <h2 id="achievement-title" className="text-3xl font-bold">
              {achievement.title}
            </h2>
            <p className="text-lg text-muted-2">{achievement.description}</p>
          </div>

          {/* Credits Display */}
          {achievement.credits !== undefined && achievement.credits > 0 && (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 border border-accent/20 rounded-full">
              <Coins className="w-5 h-5 text-accent" />
              <span className="text-xl font-bold text-accent">
                +{achievement.credits} Credits
              </span>
            </div>
          )}

          {/* Auto-dismiss notice */}
          <p className="text-xs text-muted-2">
            This will close automatically in a few seconds
          </p>
        </div>
      </div>
    </div>
  )
}
