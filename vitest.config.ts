import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

// Prefer the already-extracted mongod binary when present (avoids a slow
// re-download at test time on this machine). On other platforms/CI where it
// isn't there, fall back to mongodb-memory-server's normal download.
const localMongod = resolve(
  __dirname,
  'node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe'
)

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'lib/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    ...(existsSync(localMongod) ? { env: { MONGOMS_SYSTEM_BINARY: localMongod } } : {}),
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
