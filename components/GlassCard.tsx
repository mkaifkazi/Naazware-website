'use client'

import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

type GlassCardProps = {
  children: ReactNode
  /** Classes for the content panel (layout, padding, `group`, etc). */
  className?: string
  /** When set, renders a next/link. Otherwise renders `as` (default div). */
  href?: string
  /** Element to render as the outer host when not a link. */
  as?: 'div' | 'figure' | 'article'
} & Record<string, unknown>

const MAX_TILT = 7 // degrees

/**
 * Notched, 3D-tilting frosted-glass card.
 *
 * Structure: host (.glass-card, perspective + pointer handlers) → plate
 * (.glass-body, the tilted gradient/beam border, clip-path notch) → panel
 * (.glass-fill, frosted content + spotlight). All visuals live in CSS; this
 * component only wires pointer position into CSS vars (--rx/--ry tilt,
 * --mx/--my/--spot spotlight) imperatively via a ref — no React state, so
 * pointer moves never re-render. Reduced-motion: listeners are skipped and
 * the card renders as a static notched glass panel.
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
      const px = (clientX - r.left) / r.width // 0..1
      const py = (clientY - r.top) / r.height // 0..1
      el.style.setProperty('--ry', `${(px - 0.5) * 2 * MAX_TILT}deg`)
      el.style.setProperty('--rx', `${-(py - 0.5) * 2 * MAX_TILT}deg`)
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
      el.style.setProperty('--spot', '1')
    })
  }

  function handleLeave() {
    const el = ref.current
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--spot', '0')
  }

  const interaction = reduced
    ? {}
    : { onPointerMove: handleMove, onPointerLeave: handleLeave }

  const inner = (
    <span className="glass-body">
      <span className={`glass-fill ${className}`.trim()}>{children}</span>
    </span>
  )

  if (href) {
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className="glass-card h-full"
        {...interaction}
        {...rest}
      >
        {inner}
      </Link>
    )
  }

  const Tag = as as React.ElementType
  return (
    <Tag ref={ref} className="glass-card h-full" {...interaction} {...rest}>
      {inner}
    </Tag>
  )
}
