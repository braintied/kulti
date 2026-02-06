"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

interface SearchHelpProps {
  onSearch: (query: string) => void
  className?: string
}

export const SearchHelp = ({ onSearch, className = "" }: SearchHelpProps) => {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setSearchQuery("")
    onSearch("")
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search help articles..."
          className="w-full pl-12 pr-12 py-4 bg-surface-1 border border-border-default rounded-xl text-white placeholder:text-muted-2 focus:border-accent focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-surface-2 rounded-lg transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 text-muted-2" />
          </button>
        )}
      </div>
    </div>
  )
}
