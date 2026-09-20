export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

export function staggerDelays(count: number, stepMs: number, baseMs = 0): number[] {
  return Array.from({ length: count }, (_, i) => baseMs + i * stepMs)
}

// Eased (cubic ease-out) interpolation; exact endpoints at 0 and 1.
export function countUpValue(to: number, progress: number, from = 0): number {
  if (progress <= 0) return from
  if (progress >= 1) return to
  const eased = 1 - Math.pow(1 - progress, 3)
  return from + (to - from) * eased
}
