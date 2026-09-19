import { describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { setupTestDb } from './setup-db'

describe('test infra', () => {
  setupTestDb()

  it('connects to an in-memory mongo', () => {
    expect(mongoose.connection.readyState).toBe(1) // connected
  })
})
