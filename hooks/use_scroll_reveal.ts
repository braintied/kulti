'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  root_margin?: string
  once?: boolean
}

export function use_scroll_reveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.1, root_margin = '0px 0px -60px 0px', once = true } = options
  const ref = useRef<HTMLDivElement>(null)
  const [is_visible, set_is_visible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          set_is_visible(true)
          if (once) {
            observer.unobserve(element)
          }
        } else if (!once) {
          set_is_visible(false)
        }
      },
      { threshold, rootMargin: root_margin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, root_margin, once])

  return { ref, is_visible }
}
