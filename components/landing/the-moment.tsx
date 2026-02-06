"use client"

export function TheMoment() {
  return (
    <section className="relative py-12 md:py-24 lg:py-32 px-6 bg-gradient-to-b from-surface-1 to-black">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <p className="text-xl md:text-3xl text-muted-2 animate-fade-in">
          Your grandparents built cars on assembly lines.
        </p>

        <p className="text-xl md:text-3xl text-muted-2 animate-fade-in-delay-1">
          Your parents built companies in offices.
        </p>

        <p className="text-2xl md:text-4xl font-bold text-white animate-fade-in-delay-2">
          You're building the future<br />with AI in your bedroom.
        </p>

        <p className="text-xl md:text-3xl text-accent font-semibold animate-fade-in-delay-2">
          And nobody's watching.
        </p>
      </div>
    </section>
  )
}
