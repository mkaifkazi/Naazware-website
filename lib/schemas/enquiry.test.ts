import { describe, expect, it } from 'vitest'
import { enquiryInputSchema } from './enquiry'

const valid = {
  name: 'Ada',
  email: 'ada@example.com',
  budget: '10k-25k',
  message: 'Hello there, this is long enough.',
  consent: true as const,
}

describe('enquiryInputSchema — prefer a call', () => {
  it('accepts a plain enquiry with no call fields (defaults prefersCall false)', () => {
    const parsed = enquiryInputSchema.parse(valid)
    expect(parsed.prefersCall).toBe(false)
    expect(parsed.phone ?? '').toBe('')
  })

  it('accepts a call request with a phone number', () => {
    const parsed = enquiryInputSchema.parse({
      ...valid,
      prefersCall: true,
      phone: '+971 50 123 4567',
      preferredTime: 'Weekday mornings',
    })
    expect(parsed.prefersCall).toBe(true)
    expect(parsed.phone).toBe('+971 50 123 4567')
  })

  it('rejects a call request with no phone', () => {
    const res = enquiryInputSchema.safeParse({ ...valid, prefersCall: true, phone: '' })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes('phone'))).toBe(true)
    }
  })

  it('rejects a call request with whitespace-only phone', () => {
    const res = enquiryInputSchema.safeParse({ ...valid, prefersCall: true, phone: '   ' })
    expect(res.success).toBe(false)
  })
})
