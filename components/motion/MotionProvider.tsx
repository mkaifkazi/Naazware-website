'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { type ReactNode } from 'react'

export default function MotionProvider({ children }: { children: ReactNode }) {
  // Non-strict: any stray full `motion` component still works; `m` components
  // share this single lazily-loaded feature bundle (domAnimation).
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
