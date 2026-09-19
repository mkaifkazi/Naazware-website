import { z } from 'zod'

const ALLOWED = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf',
]

export const signSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().refine((t) => ALLOWED.includes(t), 'Unsupported file type'),
  folder: z.string().max(60).regex(/^[a-z0-9/_-]*$/i).optional(),
})

export const registerSchema = z.object({
  key: z.string().min(1).max(300),
  type: z.string().max(120),
  size: z.number().int().nonnegative().max(50 * 1024 * 1024), // 50MB cap
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  alt: z.string().max(400).optional(),
  filename: z.string().max(200).optional(),
})
