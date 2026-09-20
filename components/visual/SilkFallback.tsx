import type { SilkComposition } from '@/lib/silk'
import { toFallbackLayers } from '@/lib/silk'

export default function SilkFallback({
  composition,
  animated = true,
}: {
  composition: SilkComposition
  animated?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${animated ? 'animate-silk-drift' : ''}`}
      style={{ backgroundImage: toFallbackLayers(composition), willChange: 'transform' }}
    />
  )
}
