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
  className = '',
}: {
  composition?: Partial<SilkComposition>
  allowWebGL?: boolean
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

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-0 ${className}`}>
      {webgl ? <SilkCanvas composition={c} /> : <SilkFallback composition={c} animated={!reduced} />}
    </div>
  )
}
