"use client"

const scrollToWaitlist = () => {
  const waitlistSection = document.getElementById("waitlist")
  if (waitlistSection) {
    waitlistSection.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#1a1a1a]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
        {/* Main headline */}
        <h1 className="font-mono font-bold text-7xl md:text-8xl lg:text-9xl mb-8 animate-fade-in">
          Build The Future, Live
        </h1>

        {/* Subheadline */}
        <div className="max-w-3xl mx-auto space-y-4 mb-12 text-xl md:text-2xl text-[#a1a1aa] animate-fade-in-delay-1">
          <p>You're living through the biggest shift in how things get made.</p>
          <p className="font-semibold text-white">AI just showed up. Changed everything. Overnight.</p>
        </div>

        {/* CTA Button */}
        <button
          onClick={scrollToWaitlist}
          className="inline-block bg-[#00ff88] text-black font-bold text-xl px-12 py-5 rounded-xl hover:scale-105 transition-transform duration-300 animate-fade-in-delay-2 cursor-pointer"
        >
          Get Early Access
        </button>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#27272a] rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-[#00ff88] rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
