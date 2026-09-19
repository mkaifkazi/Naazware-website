import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { site } from './site'
import { getSettings, updateSettings, getSettingsDoc } from './settings-service'

describe('settings-service', () => {
  setupTestDb()

  it('getSettings returns site defaults when nothing stored', async () => {
    const s = await getSettings()
    expect(s.email).toBe(site.email)
    expect(s.socials.linkedin).toBe(site.socials.linkedin)
    expect(s.name).toBe(site.name) // structural default
  })

  it('updateSettings persists and getSettings layers it over defaults', async () => {
    await updateSettings({ email: 'new@naazware.com', linkedin: 'https://linkedin.com/company/naaz' })
    const s = await getSettings()
    expect(s.email).toBe('new@naazware.com')
    expect(s.socials.linkedin).toBe('https://linkedin.com/company/naaz')
    expect(s.phone).toBe(site.phone) // untouched field still default
  })

  it('updateSettings is a singleton upsert (one doc, empty strings fall back)', async () => {
    await updateSettings({ email: 'a@b.com' })
    await updateSettings({ email: '' }) // cleared → falls back to default
    const s = await getSettings()
    expect(s.email).toBe(site.email)
    expect(await getSettingsDoc()).not.toBeNull()
  })

  it('derives phoneHref from an overridden phone', async () => {
    await updateSettings({ phone: '+91 90000 11111' })
    const s = await getSettings()
    expect(s.phoneHref).toBe('tel:+919000011111')
  })
})
