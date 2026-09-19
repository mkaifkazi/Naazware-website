import { connectDb } from './db'
import { Settings, type SettingsDoc } from './models/Settings'
import { site } from './site'
import type { SettingsInput } from './schemas/settings'

export type SiteSettings = {
  name: string
  legalName: string
  tagline: string
  description: string
  url: string
  email: string
  phone: string
  phoneHref: string
  location: string
  socials: { linkedin: string; twitter: string; github: string }
}

export async function getSettingsDoc(): Promise<SettingsDoc | null> {
  await connectDb()
  return Settings.findOne().lean<SettingsDoc>()
}

export async function updateSettings(input: SettingsInput): Promise<void> {
  await connectDb()
  await Settings.findOneAndUpdate({}, { $set: input }, { upsert: true })
}

const pick = (v: string | undefined | null, fallback: string): string =>
  v && v.trim() ? v : fallback

export async function getSettings(): Promise<SiteSettings> {
  const d = await getSettingsDoc()
  const phone = pick(d?.phone, site.phone)
  const phoneHref = phone === site.phone ? site.phoneHref : `tel:${phone.replace(/[^0-9+]/g, '')}`
  return {
    name: site.name,
    legalName: site.legalName,
    tagline: pick(d?.tagline, site.tagline),
    description: pick(d?.description, site.description),
    url: site.url,
    email: pick(d?.email, site.email),
    phone,
    phoneHref,
    location: pick(d?.location, site.location),
    socials: {
      linkedin: pick(d?.linkedin, site.socials.linkedin),
      twitter: pick(d?.twitter, site.socials.twitter),
      github: pick(d?.github, site.socials.github),
    },
  }
}
