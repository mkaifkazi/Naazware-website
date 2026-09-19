import mongoose from 'mongoose'
import dns from 'node:dns'

// Opt-in DNS override for environments whose default resolver can't answer the
// mongodb+srv SRV lookup (e.g. a local box pointing at an IPv6 link-local
// gateway). Set DNS_SERVERS="8.8.8.8,1.1.1.1" in .env.local. Unset in prod.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean))
}

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
