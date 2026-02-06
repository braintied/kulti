"use client"

export function WhyThisMatters() {
  return (
    <section className="relative py-32 px-6 bg-gradient-to-b from-black via-surface-1 to-black">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="font-mono text-6xl md:text-7xl font-bold mb-12">
          <span className="text-accent mr-4">&gt;</span>This Is History Happening
        </h2>

        <p className="text-3xl md:text-4xl text-white leading-relaxed">
          The first generation building with AI.
          <br />
          The first time creation is this collaborative.
        </p>

        <p className="text-2xl md:text-3xl text-muted-2">
          And it's happening in silence.
        </p>

        <p className="text-4xl md:text-5xl font-bold text-accent pt-8">
          Not anymore.
        </p>
      </div>
    </section>
  )
}
