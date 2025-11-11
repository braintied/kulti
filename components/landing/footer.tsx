"use client"

export function Footer() {
  return (
    <footer className="relative py-20 px-6 bg-[#0a0a0a] border-t border-[#27272a]">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <p className="text-lg text-[#a1a1aa]">
          Follow{" "}
          <a
            href="https://twitter.com/kulti"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00ff88] underline hover:text-white transition-colors"
          >
            @kulti
          </a>{" "}
          — We're building this live
        </p>

        <p className="text-sm text-[#a1a1aa]">
          Built in public. Powered by 100ms.
        </p>

        <p className="text-xl italic text-[#a1a1aa] max-w-2xl mx-auto pt-6">
          "The most creative generation in history
          <br />
          shouldn't build in silence."
        </p>

        <p className="text-sm text-[#71717a] pt-6">
          © 2025 Kulti
        </p>
      </div>
    </footer>
  )
}
