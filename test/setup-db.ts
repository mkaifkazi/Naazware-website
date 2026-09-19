import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'

let mongod: MongoMemoryServer

/** Call inside a describe block to get an isolated in-memory Mongo per test file. */
export function setupTestDb() {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
  })

  afterEach(async () => {
    const { collections } = mongoose.connection
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({})
    }
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongod.stop()
  })
}
