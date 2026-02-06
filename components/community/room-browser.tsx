"use client"

import { useState, useMemo } from "react"
import { RoomWithMembership, RoomCategory } from "@/lib/community/types"
import Link from "next/link"
import { Search, Hash, Users, MessageSquare } from "lucide-react"

interface RoomBrowserProps {
  rooms: RoomWithMembership[]
  currentUserId: string
}

const CATEGORY_ICONS: Record<RoomCategory, string> = {
  general: "",
  "web-dev": "",
  "mobile-dev": "",
  backend: "",
  devops: "",
  "ai-ml": "🤖",
  "data-science": "",
  design: "",
  "game-dev": "",
  blockchain: "⛓️",
  security: "🔒",
  help: "🆘",
  announcements: "📢",
}

const CATEGORY_LABELS: Record<RoomCategory, string> = {
  general: "General",
  "web-dev": "Web Development",
  "mobile-dev": "Mobile Development",
  backend: "Backend",
  devops: "DevOps",
  "ai-ml": "AI & ML",
  "data-science": "Data Science",
  design: "Design",
  "game-dev": "Game Development",
  blockchain: "Blockchain",
  security: "Security",
  help: "Help & Support",
  announcements: "Announcements",
}

type CategoryFilter = RoomCategory | "all" | "joined"

export function RoomBrowser({ rooms, currentUserId: _currentUserId }: RoomBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

  // Filter rooms
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(query) ||
          room.description?.toLowerCase().includes(query) ||
          room.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (categoryFilter === "joined") {
      filtered = filtered.filter((room) => room.is_member)
    } else if (categoryFilter !== "all") {
      filtered = filtered.filter((room) => room.category === categoryFilter)
    }

    // Sort by: joined rooms first, then by member count
    return [...filtered].sort((a, b) => {
      if (a.is_member && !b.is_member) return -1
      if (!a.is_member && b.is_member) return 1
      return b.member_count - a.member_count
    })
  }, [rooms, searchQuery, categoryFilter])

  // Count rooms by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: rooms.length,
      joined: rooms.filter((r) => r.is_member).length,
    }

    rooms.forEach((room) => {
      counts[room.category] = (counts[room.category] || 0) + 1
    })

    return counts
  }, [rooms])

  return (
    <div className="space-y-5 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Community Rooms</h1>
          <p className="text-sm sm:text-base text-muted-2 mt-1">
            Join conversations and discuss topics with other developers
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-3 w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        <label htmlFor="room-search" className="sr-only">
          Search rooms by name, description, or tags
        </label>
        <input
          id="room-search"
          type="text"
          placeholder="Search rooms by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 min-h-[48px] bg-surface-1 border border-border-default rounded-xl text-white placeholder-muted-3 focus:border-accent focus:outline-none transition-colors text-base sm:text-lg"
          aria-label="Search community rooms"
        />
      </div>

      {/* Category Filters - Horizontal scroll on mobile */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            categoryFilter === "all"
              ? "bg-accent text-black"
              : "bg-surface-1 text-muted-2 border border-border-default hover:border-border-default"
          }`}
        >
          All ({categoryCounts.all || 0})
        </button>
        <button
          onClick={() => setCategoryFilter("joined")}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            categoryFilter === "joined"
              ? "bg-accent text-black"
              : "bg-surface-1 text-muted-2 border border-border-default hover:border-border-default"
          }`}
        >
          Joined ({categoryCounts.joined || 0})
        </button>
        <div className="w-px bg-surface-2 mx-2 hidden sm:block" />
        {(Object.keys(CATEGORY_LABELS) as RoomCategory[]).map((category) => {
          const count = categoryCounts[category] || 0
          if (count === 0) return null
          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                categoryFilter === category
                  ? "bg-accent text-black"
                  : "bg-surface-1 text-muted-2 border border-border-default hover:border-border-default"
              }`}
            >
              <span className="hidden sm:inline">{CATEGORY_ICONS[category]} </span>
              {CATEGORY_LABELS[category]} ({count})
            </button>
          )
        })}
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12" role="status" aria-label="No rooms found">
          <div className="text-sm font-mono text-muted-3 mb-4" aria-hidden="true">search</div>
          <p className="text-muted-2 text-base sm:text-lg">No rooms found</p>
          <p className="text-muted-3 text-sm mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}

interface RoomCardProps {
  room: RoomWithMembership
}

function RoomCard({ room }: RoomCardProps) {
  const categoryLabel = CATEGORY_LABELS[room.category]
  const categoryIcon = CATEGORY_ICONS[room.category]

  return (
    <Link
      href={`/community/${room.slug}`}
      aria-label={`${room.name} - ${room.member_count} members, ${room.message_count} messages`}
    >
      <div
        className={`group relative bg-surface-1 border rounded-xl p-6 hover:border-accent transition-all cursor-pointer ${
          room.is_member ? "border-accent/50" : "border-border-default"
        }`}
      >
        {/* Member Badge */}
        {room.is_member && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-accent/20 border border-accent/50 rounded-md">
            <span className="text-xs font-medium text-accent">Joined</span>
          </div>
        )}

        {/* Unread Badge */}
        {room.is_member && room.unread_count > 0 && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-border-dim">
            <span className="text-xs font-bold text-white">
              {room.unread_count > 99 ? "99+" : room.unread_count}
            </span>
          </div>
        )}

        {/* Icon */}
        <div className="text-5xl mb-3">{room.icon_emoji || categoryIcon}</div>

        {/* Room Name */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
          {room.name}
        </h3>

        {/* Description */}
        {room.description && (
          <p className="text-muted-2 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Category */}
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-muted-3" />
          <span className="text-xs text-muted-2">{categoryLabel}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-3">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{room.member_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{room.message_count.toLocaleString()}</span>
          </div>
        </div>

        {/* Tags */}
        {room.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {room.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-surface-2 text-muted-2 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
            {room.tags.length > 3 && (
              <span className="px-2 py-1 text-muted-3 text-xs">
                +{room.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
