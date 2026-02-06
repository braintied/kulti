"use client"

import { useState } from "react"
import { Edit, Flame } from "lucide-react"
import { Profile } from "@/types/database"
import { EditProfileModal } from "./edit-profile-modal"

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <>
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-green-500/5 rounded-2xl" />

        {/* Content */}
        <div className="relative p-8 border border-border-default rounded-2xl bg-surface-1/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-green-500 flex items-center justify-center">
                <span className="text-6xl font-bold text-black">
                  {profile.display_name[0].toUpperCase()}
                </span>
              </div>
              {/* Streak Badge */}
              {profile.current_streak && profile.current_streak > 0 && (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 px-3 py-1 bg-orange-500 rounded-full border-2 border-border-default">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">
                    {profile.current_streak}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-mono text-4xl font-bold mb-2">
                    {profile.display_name}
                  </h1>
                  <p className="text-xl text-muted-2">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-lg text-muted-2 mt-4 max-w-2xl">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Edit Button */}
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-6 py-3 border border-border-default hover:border-accent rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="font-medium">Edit Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
        />
      )}
    </>
  )
}
