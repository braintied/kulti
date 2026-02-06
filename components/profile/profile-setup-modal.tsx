"use client"

import { useState } from "react"
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react"
import { SKILL_OPTIONS, INTEREST_OPTIONS, EXPERIENCE_LEVELS, type ExperienceLevel } from "@/lib/matchmaking/constants"
import { logger } from '@/lib/logger'

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: ProfileData) => Promise<void>
  initialData?: Partial<ProfileData>
}

export interface ProfileData {
  skills: string[]
  interests: string[]
  experienceLevel: ExperienceLevel
}

export function ProfileSetupModal({
  isOpen,
  onClose,
  onComplete,
  initialData,
}: ProfileSetupModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [skills, setSkills] = useState<string[]>(initialData?.skills || [])
  const [customSkill, setCustomSkill] = useState("")

  const [interests, setInterests] = useState<string[]>(initialData?.interests || [])
  const [customInterest, setCustomInterest] = useState("")

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialData?.experienceLevel || 'intermediate'
  )

  const totalSteps = 3

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const addCustomSkill = () => {
    const trimmed = customSkill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setCustomSkill("")
    }
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const addCustomInterest = () => {
    const trimmed = customInterest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed])
      setCustomInterest("")
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      await onComplete({
        skills,
        interests,
        experienceLevel,
      })
      onClose()
    } catch (err) {
      logger.error('Profile setup error:', { error: err })
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-setup-title">
      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] bg-surface-1 border border-border-default rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-accent/10 to-green-500/10 border-b border-border-default p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-surface-2 rounded-lg transition-colors"
            aria-label="Close profile setup modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent rounded-xl">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 id="profile-setup-title" className="font-mono text-2xl font-bold">Complete Your Profile</h2>
              <p className="text-sm text-muted-2">
                Help us find perfect session matches for you
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < step ? 'bg-accent' : 'bg-surface-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Skills */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">What are your skills?</h3>
                <p className="text-sm text-muted-2">
                  Select the technologies and tools you work with (select at least 1)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      skills.includes(skill)
                        ? 'bg-accent text-black'
                        : 'bg-surface-2 text-muted-1 hover:bg-surface-3'
                    }`}
                  >
                    {skill}
                    {skills.includes(skill) && (
                      <Check className="inline-block w-4 h-4 ml-1" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Skill Input */}
              <div>
                <label className="block text-sm font-medium text-muted-2 mb-2">
                  Add custom skill
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                    placeholder="e.g., GraphQL"
                    className="flex-1 px-4 py-2 bg-surface-2 border border-border-default rounded-lg text-white text-sm focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={addCustomSkill}
                    disabled={!customSkill.trim()}
                    className="px-4 py-2 bg-accent hover:bg-accent text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {skills.length > 0 && (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
                  <p className="text-sm text-accent font-medium">
                    ✓ {skills.length} skill{skills.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">What interests you?</h3>
                <p className="text-sm text-muted-2">
                  Choose topics you want to learn about or teach (select at least 1)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      interests.includes(interest)
                        ? 'bg-accent text-black'
                        : 'bg-surface-2 text-muted-1 hover:bg-surface-3'
                    }`}
                  >
                    {interest}
                    {interests.includes(interest) && (
                      <Check className="inline-block w-4 h-4 ml-1" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Interest Input */}
              <div>
                <label className="block text-sm font-medium text-muted-2 mb-2">
                  Add custom interest
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
                    placeholder="e.g., Microservices"
                    className="flex-1 px-4 py-2 bg-surface-2 border border-border-default rounded-lg text-white text-sm focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={addCustomInterest}
                    disabled={!customInterest.trim()}
                    className="px-4 py-2 bg-accent hover:bg-accent text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {interests.length > 0 && (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
                  <p className="text-sm text-accent font-medium">
                    ✓ {interests.length} interest{interests.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Experience Level */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">What's your experience level?</h3>
                <p className="text-sm text-muted-2">
                  This helps us match you with people at the right level
                </p>
              </div>

              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      experienceLevel === level.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border-default bg-surface-2 hover:border-border-default'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{level.label}</p>
                        <p className="text-sm text-muted-3 mt-1">{level.description}</p>
                      </div>
                      {experienceLevel === level.value && (
                        <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-default p-6">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-3 hover:text-muted-1 transition-colors"
            >
              Skip for now
            </button>

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-surface-2 hover:bg-surface-3 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {step < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && skills.length < 1) ||
                    (step === 2 && interests.length < 1)
                  }
                  className="px-6 py-3 bg-accent hover:bg-accent text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-6 py-3 bg-accent hover:bg-accent text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
