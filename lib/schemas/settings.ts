import { z } from 'zod'

const optionalUrl = z.string().url().max(500).optional().or(z.literal(''))

export const settingsInputSchema = z.object({
  tagline: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  email: z.string().email().max(320).optional().or(z.literal('')),
  phone: z.string().max(60).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  linkedin: optionalUrl,
  twitter: optionalUrl,
  github: optionalUrl,
})

export type SettingsInput = z.infer<typeof settingsInputSchema>
