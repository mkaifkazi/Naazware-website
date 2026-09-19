import mongoose from 'mongoose'

// Cache across hot reloads (dev) and serverless invocations (prod) to avoid
// exhausting connections. Standard Next.js + Mongoose pattern.
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
const g = globalThis as unknown as { _mongoose?: Cache }
const cache: Cache = g._mongoose ?? { conn: null, promise: null }
g._mongoose = cache

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn
  // Reuse an already-open connection (e.g. an in-memory server opened by tests).
  if (mongoose.connection.readyState === 1) {
    cache.conn = mongoose
    return cache.conn
  }
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false })
  }
  cache.conn = await cache.promise
  return cache.conn
}
