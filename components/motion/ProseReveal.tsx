'use client'

import { Children, type ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function ProseReveal({
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ staggerChildren: 0.08 }}
    >
      {Children.map(children, (child, i) => (
        <m.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
          }}
        >
          {child}
        </m.div>
      ))}
    </m.div>
  )
}
