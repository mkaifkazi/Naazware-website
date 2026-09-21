'use client'

import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

type GlassCardProps = {
  children: ReactNode
  className?: string
  /** When set, renders a next/link. Otherwise renders `as` (default div). */
  href?: string
  /** Element to render when not a link. */
  as?: 'div' | 'figure' | 'article'
} & Record<string, unknown>

/**
 * Frosted-glass card primitive. Owns the `.glass-card` surface + gradient border
 * (pure CSS) and a cursor-tracked spotlight. Spotlight writes --mx/--my/--spot
 * imperatively via a ref — no React state, so pointer moves never re-render.
 * Reduced-motion: pointer listeners are skipped and the card stays static glass.
 */
export default function GlassCard({
  children,
  className = '',
  href,
  as = 'div',
  ...rest
}: GlassCardProps) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number | undefined>(undefined)

  function handleMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el || rafRef.current !== undefined) return
    const { clientX, clientY } = e
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${((clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--my', `${((clientY - r.top) / r.height) * 100}%`)
      el.style.setProperty('--spot', '1')
    })
  }

  function handleLeave() {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }
    ref.current?.style.setProperty('--spot', '0')
  }

  const interaction = reduced
    ? {}
    : { onPointerMove: handleMove, onPointerLeave: handleLeave }

  const cls = `glass-card ${className}`.trim()

  if (href) {
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        {...interaction}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  const Tag = as as React.ElementType
  return (
    <Tag ref={ref} className={cls} {...interaction} {...rest}>
      {children}
    </Tag>
  )
}
