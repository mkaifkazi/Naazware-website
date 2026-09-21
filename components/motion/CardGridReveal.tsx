'use client'

import { Children, type ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function CardGridReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  // Reduced branch must keep the SAME DOM structure as the animated branch —
  // same outer div + same per-child wrapper. useReducedMotion() is false during
  // SSR (no media query on the server), so the server always emits the animated
  // structure; if the reduced client rendered a shallower tree here, the child
  // (e.g. a ServiceCard <a>) would land at a different depth → hydration mismatch
  // ("Expected server HTML to contain a matching <a> in <div>").
  if (reduced) {
    return (
      <div className={className}>
        {Children.map(children, (child, i) => (
          <div key={i} className="relative hover:z-30">
            {child}
          </div>
        ))}
      </div>
    )
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ staggerChildren: 0.06 }}
    >
      {Children.map(children, (child, i) => (
        <m.div
          key={i}
          className="relative hover:z-30"
          variants={{
            hidden: { opacity: 0, y: 16, scale: 0.96 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.6, ease: EASE_OUT_EXPO },
            },
          }}
        >
          {child}
        </m.div>
      ))}
    </m.div>
  )
}
