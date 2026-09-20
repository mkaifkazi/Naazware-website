export type SilkComposition = {
  angle: number // degrees, [0,360)
  scale: number // [0.5, 2]
  offset: { x: number; y: number } // percent, [-100,100]
  intensity: number // [0,1] — alpha multiplier
}

export const SILK_DEFAULTS: SilkComposition = {
  angle: 135,
  scale: 1,
  offset: { x: 0, y: 0 },
  intensity: 0.7,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const wrap360 = (a: number) => ((a % 360) + 360) % 360

export function normalizeComposition(partial: Partial<SilkComposition> = {}): SilkComposition {
  return {
    angle: wrap360(partial.angle ?? SILK_DEFAULTS.angle),
    scale: clamp(partial.scale ?? SILK_DEFAULTS.scale, 0.5, 2),
    intensity: clamp(partial.intensity ?? SILK_DEFAULTS.intensity, 0, 1),
    offset: {
      x: clamp(partial.offset?.x ?? 0, -100, 100),
      y: clamp(partial.offset?.y ?? 0, -100, 100),
    },
  }
}

// Base alphas per silk layer, scaled by intensity. Kept low so text stays AA.
const BASE_ALPHA = [0.22, 0.16, 0.2] as const

export function toFallbackLayers(c: SilkComposition): string {
  const a = (i: number) => (BASE_ALPHA[i] * c.intensity).toFixed(3)
  // Anchor points drift with offset; two radial pools + one directional wash.
  const p1x = 22 + c.offset.x * 0.4
  const p1y = 18 + c.offset.y * 0.4
  const p2x = 80 - c.offset.x * 0.3
  const p2y = 78 - c.offset.y * 0.3
  const spread = 60 * c.scale
  return [
    `radial-gradient(${spread}% ${spread * 0.8}% at ${p1x}% ${p1y}%, rgb(var(--silk-1) / ${a(0)}), transparent 62%)`,
    `radial-gradient(${spread * 0.9}% ${spread * 0.75}% at ${p2x}% ${p2y}%, rgb(var(--silk-3) / ${a(2)}), transparent 64%)`,
    `linear-gradient(${c.angle}deg, rgb(var(--silk-2) / ${a(1)}), transparent 70%)`,
  ].join(', ')
}

export function toCanvasUniforms(c: SilkComposition) {
  return {
    angleRad: (c.angle * Math.PI) / 180,
    scale: c.scale,
    offsetX: c.offset.x / 100,
    offsetY: c.offset.y / 100,
    intensity: c.intensity,
  }
}
