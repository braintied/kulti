"use client"

export function WhatThisIs() {
  return (
    <section className="relative py-12 md:py-24 lg:py-32 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-mono text-3xl md:text-5xl font-bold mb-6">
            <span className="text-accent mr-4">&gt;</span>This Is Kulti
          </h2>
          <p className="text-lg md:text-2xl text-muted-2 max-w-3xl mx-auto">
            The place where the future gets built. Together. Live.
          </p>
        </div>

        {/* Three cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Watch */}
          <div className="group p-6 md:p-12 rounded-2xl border border-border-default bg-surface-1/50 backdrop-blur-sm hover:border-accent hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-mono text-2xl font-bold text-accent mb-4">
              Watch
            </h3>
            <p className="text-lg text-muted-2 leading-relaxed">
              Drop into live sessions.
              See how real builders think.
              Learn by watching actual workflows.
              <br /><br />
              Not polished tutorials.
              Raw building in real-time.
            </p>
          </div>

          {/* Build */}
          <div className="group p-6 md:p-12 rounded-2xl border border-border-default bg-surface-1/50 backdrop-blur-sm hover:border-accent hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-mono text-2xl font-bold text-accent mb-4">
              Build
            </h3>
            <p className="text-lg text-muted-2 leading-relaxed">
              Go live. Build your thing.
              Other builders drop in.
              You help each other.
              <br /><br />
              Multi-person sessions.
              Pass control back and forth.
              Actually collaborate.
            </p>
          </div>

          {/* Become */}
          <div className="group p-6 md:p-12 rounded-2xl border border-border-default bg-surface-1/50 backdrop-blur-sm hover:border-accent hover:-translate-y-1 transition-all duration-300">
            <h3 className="font-mono text-2xl font-bold text-accent mb-4">
              Become
            </h3>
            <p className="text-lg text-muted-2 leading-relaxed">
              Your first session, you watch.
              Your third session, you're helping.
              Your tenth session, you're teaching.
              <br /><br />
              This is how movements form.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
