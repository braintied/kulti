"use client"

export function Footer() {
  return (
    <footer className="relative py-20 px-6 bg-black">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <p className="text-lg text-muted-2">
          Follow{" "}
          <a
            href="https://twitter.com/kulti.club"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:text-muted-1 transition-colors"
          >
            @kulti.club
          </a>{" "}
          — We're building the future
        </p>

        <p className="text-xl italic text-muted-2 max-w-2xl mx-auto pt-6">
          "The most creative generation in history
          <br />
          shouldn't build in silence."
        </p>

        <p className="text-sm text-muted-2 pt-6">
          Powered by{" "}
          <a
            href="https://braintied.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:text-muted-1 transition-colors"
          >
            Braintied
          </a>
        </p>

        <p className="text-sm text-muted-3 pt-2">
          © 2025 Kulti
        </p>
      </div>
    </footer>
  )
}
