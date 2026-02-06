import Link from 'next/link'

function KultiLogoSmall({ class_name }: { class_name?: string }) {
  return (
    <svg
      viewBox="0 0 800 800"
      fill="currentColor"
      className={class_name}
      aria-label="Kulti logo"
    >
      <path d="M400.74,478.34c-8.43-8.09-16.18-16.91-25.38-24.1-19.42-15.17-41.63-23.48-66.33-24.88-19.14-1.08-37.82,1.83-55.48,10.15-12.86,6.06-23.84,14.44-33.28,24.78-16.45,18.02-27.23,39.08-33.09,62.63-4.84,19.45-5.36,39.09-1.77,58.76,4.47,24.47,15.43,45.52,34.1,62.39,17.5,15.81,38.11,24.15,61.3,25.88,17.56,1.31,34.59-.77,50.95-7.02,20.65-7.89,37.62-20.67,50.96-38.36,10.02-13.29,17.05-28.17,21.81-44.13,5.6-18.78,8.22-37.97,8.93-57.52.51-13.93.26-27.76-1.28-41.59-.38-3.45-.86-6.89-1.37-10.33.15.78.36,1.71.43,2.51-.25-2.85,3.42-5.45,2.94-8.23,0,0-1.53,3.85-4.79,6.88-2.16,2.01-5.64,4.36-10.35,4.36-5.62,0-9.77-3.4-11.74-5.45-5.51-5.72-5.83-13.1-5.86-14.32.07,1.8.63,9.92,7.59,16.42" />
      <path d="M332.37,153.51c-2.65,8.87-4.93,17.87-7.01,26.92-8.48,36.94-13.84,74.34-17.07,112.13-2.95,34.57-3.82,69.17-1.96,103.82.52,9.68,1.26,19.35,2.41,28.98.18,1.54.49,3.07.74,4.61-4.2-6.7-8.08-13.62-11.49-20.83-8.49-17.99-13.34-36.98-14.88-56.82-1.37-17.62.25-34.96,4.11-52.14,5.12-22.82,14.39-43.63,28.41-62.12,9.53-12.56,20.61-23.59,33.03-33.24,1.03-.8,2.01-1.67,3.04-2.48,5.08-3.97,6.54-6.18,7.55-9.63,1.15-3.93.2-6.91-.19-7.93-1.59-4.14-4.78-5.75-4.78-5.75,0,0,3.5.12,6.62,2.82,4.26,3.69,3.84,9.64,3.77,10.27-.28,2.52-1.11,4.23-2.15,6.47-1.49,3.2-3.98,6.48-7.55,8.93-7.63,5.24-15.06,10.77-22.21,16.67-21.98,18.13-38.29,40.52-49.68,67.06-9.82,22.89-14.78,47.06-15.3,71.95-.34,16.11,1.14,32.02,4.98,47.68,6.32,25.76,18.1,48.55,36.62,67.57.37.38.77.73,1.15,1.1" />
      <path d="M446.32,254.34c-2.15-2.31-4.71-3.88-7.69-4.7-4.6-1.27-8.97-.43-12.91,2.26-.72.49-1.39,1.06-2.15,1.65.82-3.46,2.47-6.31,4.93-8.72,5.28-5.16,11.46-6.04,18.23-3.12,2.68,1.15,4.93,2.94,6.89,5.05,8.5,9.16,13.97,20.02,17.86,31.77,7.05,21.34,9.98,43.36,10.87,65.72,1.06,26.7-.2,53.26-3.55,79.72-3.81,30.12-9.71,59.74-18.97,88.51-7.35,22.87-16.28,45.03-28.33,65.58-.46.78-.98,1.53-1.47,2.29-.47-.8-.85-1.44-1.23-2.09-6.03-10.22-11.48-20.72-16.15-31.6-9.92-23.13-16.72-47.25-20.46-72.2-4.69-31.33-5.54-62.77-2.16-94.29,3.03-28.24,8.91-55.83,19.5-82.18,4.66-11.6,10.2-22.73,17.38-33.01,4.75-6.8,10.12-13.01,16.76-18.04.57-.43,1.2-.79,1.8-1.19" />
    </svg>
  )
}

const footer_links = [
  { label: 'about', href: '/about' },
  { label: 'docs', href: '/docs' },
  { label: 'watch', href: '/watch' },
  { label: 'github', href: 'https://github.com/braintied/kulti', external: true },
]

export function LandingFooter() {
  return (
    <footer className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16 pb-12">
      {/* Glass border */}
      <div className="h-px bg-white/[0.06] mb-12" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3">
          <KultiLogoSmall class_name="w-6 h-6 text-accent" />
          <span
            className="text-[15px] font-bold text-accent lowercase"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            kulti
          </span>
        </div>

        {/* Nav links — monochromatic hover */}
        <nav className="flex items-center gap-8">
          {footer_links.map((link) => {
            const shared_class = "text-[13px] text-muted-4 hover:text-muted-1 transition-colors duration-150 lowercase"
            const font_style = { fontFamily: 'var(--font-jetbrains-mono)' }

            if (link.external === true) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shared_class}
                  style={font_style}
                >
                  {link.label}
                </a>
              )
            }

            return (
              <Link
                key={link.label}
                href={link.href}
                className={shared_class}
                style={font_style}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign-off — monochromatic */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <p
            className="text-[12px] text-muted-4 lowercase"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            built by machines
          </p>
        </div>
      </div>
    </footer>
  )
}
