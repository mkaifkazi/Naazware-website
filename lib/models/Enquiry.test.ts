import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Enquiry } from './Enquiry'

describe('Enquiry model', () => {
  setupTestDb()

  it('defaults status to new and stamps timestamps', async () => {
    const doc = await Enquiry.create({ name: 'Ada', email: 'ada@example.com', message: 'Hello there' })
    expect(doc.status).toBe('new')
    expect(doc.createdAt).toBeInstanceOf(Date)
  })

  it('rejects a document missing required fields', async () => {
    await expect(Enquiry.create({ name: 'NoEmail' })).rejects.toBeTruthy()
  })
})
