import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  createEnquiry, listEnquiries, getEnquiryById, setEnquiryStatus, deleteEnquiry,
} from './enquiries-service'

const base = { budget: '10k-25k', consent: true as const }

describe('enquiries-service', () => {
  setupTestDb()

  it('createEnquiry stores with status new', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Ada', email: 'ada@example.com', message: 'Hello there' })
    const doc = await getEnquiryById(id)
    expect(doc?.name).toBe('Ada')
    expect(doc?.status).toBe('new')
  })

  it('createEnquiry drops the honeypot field', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Bot', email: 'bot@example.com', message: 'spam message', website: '' })
    const doc = await getEnquiryById(id)
    expect((doc as Record<string, unknown>).website).toBeUndefined()
  })

  it('setEnquiryStatus updates status', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Grace', email: 'grace@example.com', message: 'Question here' })
    expect(await setEnquiryStatus(id, 'read')).toBe(true)
    expect((await getEnquiryById(id))?.status).toBe('read')
  })

  it('setEnquiryStatus returns false for missing id', async () => {
    expect(await setEnquiryStatus('507f1f77bcf86cd799439011', 'read')).toBe(false)
  })

  it('listEnquiries filters by status and search, newest first', async () => {
    await createEnquiry({ ...base, name: 'Alpha Co', email: 'a@acme.com', message: 'first message' })
    const second = await createEnquiry({ ...base, name: 'Beta Co', email: 'b@beta.com', message: 'second message' })
    await setEnquiryStatus(second.id, 'archived')
    expect((await listEnquiries({ status: 'archived' })).length).toBe(1)
    const found = await listEnquiries({ search: 'beta' })
    expect(found.map((e) => e.name)).toContain('Beta Co')
    const all = await listEnquiries()
    expect(all[0].name).toBe('Beta Co') // newest first
  })

  it('createEnquiry persists call-preference fields', async () => {
    const { id } = await createEnquiry({
      ...base,
      name: 'Call Me',
      email: 'call@example.com',
      message: 'Please ring me about this.',
      prefersCall: true,
      phone: '+971 50 000 0000',
      preferredTime: 'Afternoons',
    })
    const doc = await getEnquiryById(id)
    expect(doc?.prefersCall).toBe(true)
    expect(doc?.phone).toBe('+971 50 000 0000')
    expect(doc?.preferredTime).toBe('Afternoons')
  })

  it('listEnquiries surfaces prefersCall for the table hint', async () => {
    await createEnquiry({
      ...base, name: 'Wants Call', email: 'w@example.com',
      message: 'Ring me on the mobile.', prefersCall: true, phone: '123456',
    })
    const rows = await listEnquiries({ search: 'Wants Call' })
    expect(rows[0].prefersCall).toBe(true)
    expect(rows[0].phone).toBe('123456')
  })

  it('deleteEnquiry removes it', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Temp', email: 't@t.com', message: 'delete me please' })
    expect(await deleteEnquiry(id)).toBe(true)
    expect(await getEnquiryById(id)).toBeNull()
  })
})
