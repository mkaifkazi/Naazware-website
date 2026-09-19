import { z } from 'zod'

const tiptapDoc = z
  .object({ type: z.literal('doc') })
  .passthrough()
  .nullable()
  .optional()

export const postInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  excerpt: z.string().min(1).max(600),
  coverMedia: z.string().length(24).nullable().optional(),
  content: tiptapDoc,
  author: z.string().max(200).optional(),
  category: z.string().max(120).optional(),
  tags: z.array(z.string().max(60)).max(30).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  publishDate: z.string().datetime().optional().or(z.literal('')),
  readTime: z.string().max(40).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
  ogImage: z.string().max(500).optional(),
})

export type PostInput = z.infer<typeof postInputSchema>
