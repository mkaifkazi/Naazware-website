import { describe, expect, it, vi } from 'vitest'

describe('storage helpers (pure)', () => {
  it('buildObjectKey sanitizes and namespaces', async () => {
    const { buildObjectKey } = await import('./storage')
    const key = buildObjectKey('projects', 'My Cover Photo!.PNG')
    expect(key).toMatch(/^projects\/[a-z0-9]+_my-cover-photo\.png$/i)
    expect(key).not.toContain(' ')
    expect(key).not.toContain('!')
  })

  it('publicUrl joins base and key', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-x.r2.dev')
    const { publicUrl } = await import('./storage')
    expect(publicUrl('projects/a.png')).toBe('https://pub-x.r2.dev/projects/a.png')
    vi.unstubAllEnvs()
  })

  it('r2Configured is false when R2 env is absent in tests', async () => {
    const { r2Configured } = await import('./storage')
    expect(r2Configured()).toBe(false)
  })
})
