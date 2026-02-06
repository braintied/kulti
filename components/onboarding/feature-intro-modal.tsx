"use client"

import { useState, useEffect } from "react"
import { Sparkles, X } from "lucide-react"
import { logger } from '@/lib/logger'

interface FeatureIntroModalProps {
  featureName: string
  title: string
  description: string
  tips?: string[]
  isOpen: boolean
  onClose: () => void
}

export const FeatureIntroModal = ({
  featureName,
  title,
  description,
  tips = [],
  isOpen,
  onClose,
}: FeatureIntroModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(`feature-intro-${featureName}`, "seen")
      } catch (error) {
        logger.error("Failed to save feature intro preference:", { error })
      }
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-labelledby="feature-intro-title"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-br from-surface-1 to-surface-2 border-2 border-accent/20 rounded-2xl shadow-2xl shadow-accent/10 animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-muted-2" />
        </button>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-accent/10 border-2 border-accent/20 rounded-full">
              <Sparkles className="w-12 h-12 text-accent" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 id="feature-intro-title" className="text-3xl font-bold">
              {title}
            </h2>
            <p className="text-lg text-muted-2">{description}</p>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-bold text-accent uppercase tracking-wide">
                Quick Tips
              </h3>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-2">
                    <span className="text-accent mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dont-show-again"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-muted-2 bg-transparent checked:bg-accent checked:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black cursor-pointer"
              />
              <label
                htmlFor="dont-show-again"
                className="text-sm text-muted-2 cursor-pointer select-none"
              >
                Don&apos;t show this again
              </label>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 bg-accent hover:bg-accent text-black font-bold text-lg rounded-xl transition-colors duration-200"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
