import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Session, Profile } from "@/types/database"
import { Users, Clock, Star } from "lucide-react"
import { formatTime } from "@/lib/utils"

interface SessionCardProps {
  session: Session & {
    host: Profile
    participants?: { count: number }[]
  }
  currentUserId?: string
}

export function SessionCard({ session, currentUserId }: SessionCardProps) {
  const participantCount = session.participants?.[0]?.count || 0
  const isBoosted = session.boosted_until && new Date(session.boosted_until) > new Date()

  return (
    <div className={`relative group border rounded-2xl p-8 bg-[#1a1a1a]/50 backdrop-blur-sm hover:border-lime-400 hover:-translate-y-1 transition-all duration-300 animate-fade-in ${
      isBoosted ? "border-lime-400/50" : "border-[#27272a]"
    }`}>
      {/* Featured Badge */}
      {isBoosted && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-lime-400 text-black text-xs font-bold rounded-full">
          <Star className="w-3 h-3 fill-current" />
          FEATURED
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <h3 className="text-2xl font-bold font-mono line-clamp-1 group-hover:text-lime-400 transition-colors pr-24">
          {session.title}
        </h3>

        {/* Description */}
        {session.description && (
          <p className="text-[#a1a1aa] text-base line-clamp-2">
            {session.description}
          </p>
        )}

        {/* Host Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-black text-sm font-bold">
            {session.host.display_name[0].toUpperCase()}
          </div>
          <span className="text-base text-[#a1a1aa]">
            {session.host.display_name}
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-5 text-base text-[#71717a]">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>{participantCount}/{session.max_participants}</span>
          </div>
          {session.started_at && (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{formatTime(session.started_at)}</span>
            </div>
          )}
          <div className="px-3 py-1 bg-lime-400/10 text-lime-400 text-sm font-bold rounded-lg">
            LIVE
          </div>
        </div>

        {/* Join Button */}
        <Link
          href={`/s/${session.room_code}`}
          className="block w-full bg-lime-400 hover:bg-lime-500 text-black font-bold text-lg px-8 py-4 rounded-xl transition-colors duration-300 text-center"
        >
          Join Session
        </Link>
      </div>
    </div>
  )
}
