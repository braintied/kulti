"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const _scrollToWaitlist = () => {
  const waitlistSection = document.getElementById("waitlist")
  if (waitlistSection) {
    waitlistSection.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export function Hero() {
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-surface-1" />

      {/* Subtle scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(163,230,53,0.03) 0px, transparent 1px, transparent 2px, rgba(163,230,53,0.03) 3px)',
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Main headline */}
        <h1 className="font-mono font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-8 animate-fade-in">
          Build The Future, Live
        </h1>

        {/* Subheadline */}
        <div className="max-w-3xl mx-auto space-y-4 text-lg md:text-xl lg:text-2xl text-muted-2 animate-fade-in-delay-1">
          <p>This is the first time in history where being curious</p>
          <p className="font-semibold text-white">matters more than being credentialed.</p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mt-12 animate-fade-in-delay-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-surface-2 hover:bg-surface-3 text-white rounded-xl font-bold text-lg transition-all duration-300 border border-border-default hover:border-accent/30"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent text-black rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-accent/20"
          >
            Get Started
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute -bottom-[188px] left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-border-default rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-accent rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
