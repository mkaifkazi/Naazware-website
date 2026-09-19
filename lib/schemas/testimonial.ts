import { z } from 'zod'

export const testimonialInputSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  quote: z.string().min(1).max(2000),
  image: z.string().length(24).nullable().optional(),
  companyLogo: z.string().length(24).nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
})

export type TestimonialInput = z.infer<typeof testimonialInputSchema>
