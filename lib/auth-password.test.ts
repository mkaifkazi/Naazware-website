import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './auth-password'

describe('password hashing', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('s3cret-password')
    expect(hash).not.toBe('s3cret-password')
    expect(await verifyPassword(hash, 's3cret-password')).toBe(true)
    expect(await verifyPassword(hash, 'wrong')).toBe(false)
  })
})
