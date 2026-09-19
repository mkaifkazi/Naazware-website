/**
 * Bootstrap / reset the admin account from env. Run: npm run create-admin
 * Requires ADMIN_EMAIL + ADMIN_PASSWORD in .env.local.
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/db'
import { Admin } from '../lib/models/Admin'
import { hashPassword } from '../lib/auth-password'

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD || ''
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local')
  if (password.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters')

  await connectDb()
  const passwordHash = await hashPassword(password)
  const existing = await Admin.findOne({ email })
  if (existing) {
    existing.passwordHash = passwordHash
    await existing.save()
    console.log(`Updated admin password for ${email}`)
  } else {
    await Admin.create({ email, passwordHash })
    console.log(`Created admin ${email}`)
  }
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
