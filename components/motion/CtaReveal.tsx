'use client'

import { type ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function CtaReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: EASE_OUT_EXPO } }}
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </m.div>
  )
}
