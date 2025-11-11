"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/types/database"
import { LogOut, User, Coins } from "lucide-react"
import { formatCredits } from "@/lib/credits/config"

interface NavBarProps {
  profile: Profile
}

export function NavBar({ profile }: NavBarProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Fetch credit balance
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/credits/balance')
        if (response.ok) {
          const data = await response.json()
          setCredits(data.credits_balance || 0)
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()

    // Set up real-time subscription for balance updates
    const supabase = createClient()
    const channel = supabase
      .channel('credit_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload: any) => {
          if (payload.new.credits_balance !== undefined) {
            setCredits(payload.new.credits_balance)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [profile.id])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(cursorInterval)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <nav className="border-b border-[#27272a] bg-[#1a1a1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1a1a]/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/dashboard" className="font-mono text-2xl font-bold hover:text-lime-400 transition-colors">
            kulti<span className={`text-lime-400 transition-opacity duration-100 ${showCursor ? "opacity-100" : "opacity-0"}`}>_</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="text-lg text-[#a1a1aa] hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/browse" className="text-lg text-[#a1a1aa] hover:text-white transition-colors">
              Browse
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            <Link
              href="/dashboard/credits"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#27272a] hover:border-lime-400 transition-colors"
            >
              <Coins className="w-5 h-5 text-lime-400" />
              <span className="font-mono font-bold text-lime-400">
                {loading ? '...' : formatCredits(credits)}
              </span>
            </Link>

            <button
              onClick={() => router.push("/dashboard?create=true")}
              className="hidden md:block bg-lime-400 hover:bg-lime-500 text-black font-bold text-base px-8 py-3 rounded-lg transition-colors duration-300"
            >
              Create Session
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center text-black font-bold text-lg">
                  {profile.display_name[0].toUpperCase()}
                </div>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#27272a] rounded-xl shadow-2xl z-20">
                    <div className="p-5 border-b border-[#27272a]">
                      <p className="font-medium text-lg">{profile.display_name}</p>
                      <p className="text-base text-[#a1a1aa]">@{profile.username}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push(`/profile/${profile.username}`)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#2a2a2a] transition-colors text-left text-base"
                      >
                        <User size={18} />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#2a2a2a] transition-colors text-left text-base text-red-500"
                      >
                        <LogOut size={18} />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
