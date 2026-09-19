import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Admin } from './Admin'

describe('Admin model', () => {
  setupTestDb()

  it('requires email and passwordHash', async () => {
    await expect(Admin.create({})).rejects.toThrow()
  })

  it('lowercases email and defaults role=admin', async () => {
    const a = await Admin.create({ email: 'Foo@Bar.com', passwordHash: 'x' })
    expect(a.email).toBe('foo@bar.com')
    expect(a.role).toBe('admin')
  })

  it('enforces unique email', async () => {
    await Admin.init() // ensure the unique index is built before relying on it
    await Admin.create({ email: 'a@b.com', passwordHash: 'x' })
    await expect(Admin.create({ email: 'a@b.com', passwordHash: 'y' })).rejects.toThrow()
  })
})
