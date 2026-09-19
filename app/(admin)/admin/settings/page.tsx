import { getSettings } from '@/lib/settings-service'
import SettingsForm, { type SettingsValues } from '@/components/admin/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const s = await getSettings()
  const initial: SettingsValues = {
    tagline: s.tagline,
    description: s.description,
    email: s.email,
    phone: s.phone,
    location: s.location,
    linkedin: s.socials.linkedin,
    twitter: s.socials.twitter,
    github: s.socials.github,
  }
  return <SettingsForm initial={initial} />
}
