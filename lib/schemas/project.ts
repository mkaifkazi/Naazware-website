import { z } from 'zod'

const metric = z.object({ label: z.string().max(120).default(''), value: z.string().max(120).default('') })
const seo = z
  .object({
    title: z.string().max(200).optional(),
    description: z.string().max(400).optional(),
    ogImage: z.string().max(500).optional(),
  })
  .default({})

export const projectInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  client: z.string().min(1).max(200),
  industry: z.string().max(200).optional(),
  shortDescription: z.string().min(1).max(600),
  fullDescription: z.string().max(20000).optional(),
  challenge: z.string().max(10000).optional(),
  solution: z.string().max(10000).optional(),
  outcome: z.string().max(10000).optional(),
  services: z.array(z.string().max(120)).max(50).default([]),
  technologies: z.array(z.string().max(120)).max(100).default([]),
  metrics: z.array(metric).max(20).default([]),
  coverMedia: z.string().length(24).nullable().optional(),
  gallery: z.array(z.string().length(24)).max(50).default([]),
  videoUrl: z.string().url().max(500).optional().or(z.literal('')),
  externalUrl: z.string().url().max(500).optional().or(z.literal('')),
  testimonial: z
    .object({ quote: z.string().max(2000), author: z.string().max(200), role: z.string().max(200).optional() })
    .nullable()
    .optional(),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  seo,
})

export type ProjectInput = z.infer<typeof projectInputSchema>
