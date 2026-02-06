'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { KultiLogo } from './kulti_logo'

interface InteriorNavProps {
  active_route?: string
}

const NAV_LINKS = [
  { href: '/watch', label: 'watch' },
  { href: '/art', label: 'art' },
  { href: '/docs', label: 'docs' },
]

export function InteriorNav({ active_route }: InteriorNavProps) {
  const [is_scrolled, set_is_scrolled] = useState(false)

  useEffect(() => {
    const handle_scroll = () => {
      set_is_scrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handle_scroll, { passive: true })
    return () => window.removeEventListener('scroll', handle_scroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <div
        className="flex items-center justify-between rounded-full"
        style={{
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: is_scrolled ? '680px' : '100%',
          width: is_scrolled ? '92%' : '100%',
          height: is_scrolled ? '44px' : '56px',
          marginTop: is_scrolled ? '12px' : '0px',
          paddingLeft: is_scrolled ? '20px' : '48px',
          paddingRight: is_scrolled ? '20px' : '48px',
          background: is_scrolled ? 'rgba(0,0,0,0.4)' : 'transparent',
          backdropFilter: is_scrolled ? 'blur(40px)' : 'blur(0px)',
          WebkitBackdropFilter: is_scrolled ? 'blur(40px)' : 'blur(0px)',
          borderRadius: is_scrolled ? '9999px' : '0px',
          boxShadow: is_scrolled ? '0 8px 40px rgba(0,0,0,0.5)' : '0 0px 0px rgba(0,0,0,0)',
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <KultiLogo class_name="w-6 h-6 text-lime-400" />
          <span
            className="text-sm font-bold text-lime-400 lowercase tracking-tight"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            kulti
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[11px] transition-colors duration-200 ${
                active_route === link.label
                  ? 'text-lime-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/watch"
          className="px-4 py-1.5 text-[11px] font-medium text-zinc-400 rounded-full hover:text-white transition-all duration-200"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          enter
        </Link>
      </div>
    </nav>
  )
}
