'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { shouldRenderWebGL } from '@/lib/motion'
import { normalizeComposition, type SilkComposition } from '@/lib/silk'
import SilkFallback from './SilkFallback'

const SilkCanvas = dynamic(() => import('./SilkCanvas'), { ssr: false })

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export default function SilkBackground({
  composition,
  allowWebGL = true,
  global = false,
  className = '',
}: {
  composition?: Partial<SilkComposition>
  allowWebGL?: boolean
  /** One continuous fixed full-viewport backdrop behind all content (mount once). */
  global?: boolean
  className?: string
}) {
  const c = normalizeComposition(composition)
  const [webgl, setWebgl] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(prefersReduced)
    const isCoarseOrSmall =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
    const saveData = !!conn?.saveData
    if (
      allowWebGL &&
      shouldRenderWebGL({ prefersReduced, isCoarseOrSmall, saveData, webglSupported: detectWebGL() })
    ) {
      setWebgl(true)
    }
  }, [allowWebGL])

  const position = global ? 'fixed -z-10' : 'absolute -z-0'
  return (
    <div aria-hidden="true" className={`pointer-events-none ${position} inset-0 ${className}`}>
      {webgl ? (
        <SilkCanvas composition={c} />
      ) : (
        // Global backdrop stays STATIC: it sits behind many backdrop-filter panels,
        // so any drift forces every one of them to re-blur every frame (perf killer).
        // The 48s/72s motion was subliminal anyway. Per-section silk can still animate.
        <SilkFallback composition={c} animated={!reduced && !global} />
      )}
    </div>
  )
}
