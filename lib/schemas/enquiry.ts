import { z } from 'zod'

// Mirrors the public ContactForm payload (client-side zod) + defence-in-depth.
export const enquiryInputSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  budget: z.string().min(1).max(120),
  message: z.string().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(0).optional(), // honeypot — must be empty
})

export type EnquiryInput = z.infer<typeof enquiryInputSchema>

export const enquiryStatusSchema = z.object({
  status: z.enum(['new', 'read', 'archived']),
})

export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>['status']
