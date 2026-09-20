import type { SilkComposition } from '@/lib/silk'
import { normalizeComposition, toFallbackLayers } from '@/lib/silk'

/**
 * CSS silk: two layered gradient sheets drifting at different speeds/directions,
 * so the overlap reads as slow undulating silk rather than one flat wash.
 */
export default function SilkFallback({
  composition,
  animated = true,
}: {
  composition: SilkComposition
  animated?: boolean
}) {
  const a = composition
  const b = normalizeComposition({
    angle: a.angle + 55,
    scale: a.scale * 1.15,
    offset: { x: -a.offset.x, y: a.offset.y + 15 },
    intensity: a.intensity * 0.9,
  })
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-[-15%] ${animated ? 'animate-silk-drift' : ''}`}
        style={{ backgroundImage: toFallbackLayers(a), willChange: 'transform' }}
      />
      <div
        className={`absolute inset-[-15%] ${animated ? 'animate-silk-drift-slow' : ''}`}
        style={{
          backgroundImage: toFallbackLayers(b),
          willChange: 'transform',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}
