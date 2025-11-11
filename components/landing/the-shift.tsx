"use client"

export function TheShift() {
  return (
    <section className="relative py-32 px-6 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <div className="space-y-4 text-2xl md:text-3xl text-[#a1a1aa]">
            <p>We watch people game.</p>
            <p>We watch people cook.</p>
            <p>We watch people react to things.</p>
          </div>

          {/* Right column */}
          <div className="space-y-6 text-2xl md:text-3xl text-white">
            <p>But the people building the future?</p>
            <p>Using AI to create things that have never existed?</p>
            <p>Making history in real-time?</p>
          </div>
        </div>

        {/* Bottom statement */}
        <div className="mt-20 text-center space-y-6">
          <p className="text-3xl md:text-4xl text-[#a1a1aa]">
            That's not a stream.<br />
            That's not content.
          </p>

          <p className="text-4xl md:text-5xl font-bold text-[#00ff88]">
            That's the story of our generation.
          </p>

          <p className="text-2xl md:text-3xl text-white pt-4">
            And it deserves to be seen.
          </p>
        </div>
      </div>
    </section>
  )
}
