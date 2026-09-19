import { connectDb } from './db'
import { Media } from './models/Media'
import { deleteObject, publicUrl } from './storage'

export type MediaInput = {
  key: string
  type: string
  size: number
  width?: number
  height?: number
  alt?: string
  filename?: string
}

export async function createMedia(input: MediaInput): Promise<{ id: string; url: string; key: string }> {
  await connectDb()
  const url = publicUrl(input.key)
  const doc = await Media.create({ ...input, url })
  return { id: String(doc._id), url, key: input.key }
}

export async function listMedia(search?: string) {
  await connectDb()
  const filter = search
    ? { $or: [{ filename: new RegExp(search, 'i') }, { alt: new RegExp(search, 'i') }] }
    : {}
  const rows = await Media.find(filter).sort({ createdAt: -1 }).lean()
  return rows.map((m) => ({
    id: String(m._id),
    key: m.key,
    url: m.url,
    type: m.type,
    size: m.size,
    alt: m.alt,
    filename: m.filename,
    createdAt: m.createdAt as Date,
  }))
}

export async function deleteMedia(id: string): Promise<boolean> {
  await connectDb()
  const doc = await Media.findById(id)
  if (!doc) return false
  try {
    await deleteObject(doc.key)
  } catch (err) {
    console.error('R2 delete failed (removing record anyway):', err)
  }
  await doc.deleteOne()
  return true
}
