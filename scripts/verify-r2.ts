/**
 * Live R2 round-trip check. Run: npm run verify:r2  (requires R2_* in .env.local)
 * Puts a tiny object, fetches it via the public URL, deletes it.
 */
import { r2Configured, buildObjectKey, putObject, publicUrl, deleteObject } from '../lib/storage'

async function main() {
  if (!r2Configured()) throw new Error('R2 not configured — check .env.local')
  const key = buildObjectKey('_healthcheck', 'ping.txt')
  const body = `naazware r2 ok ${new Date().toISOString()}`
  await putObject(key, body, 'text/plain')
  console.log('PUT ok:', key)

  const url = publicUrl(key)
  const res = await fetch(url)
  const text = await res.text()
  console.log('GET', res.status, url)
  if (res.status !== 200 || text !== body) {
    throw new Error(`Public fetch mismatch (status ${res.status}). Is public access enabled?`)
  }
  console.log('Public URL serves the object ✓')

  await deleteObject(key)
  console.log('DELETE ok — round trip complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
