import { describe, expect, it, vi } from 'vitest'

describe('connectDb', () => {
  it('throws when MONGODB_URI is missing', async () => {
    vi.stubEnv('MONGODB_URI', '')
    const { connectDb } = await import('./db')
    await expect(connectDb()).rejects.toThrow(/MONGODB_URI/)
    vi.unstubAllEnvs()
  })
})
