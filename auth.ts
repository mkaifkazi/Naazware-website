import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@/auth.config'
import { connectDb } from '@/lib/db'
import { Admin } from '@/lib/models/Admin'
import { verifyPassword } from '@/lib/auth-password'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? '').toLowerCase().trim()
        const password = String(creds?.password ?? '')
        if (!email || !password) return null
        await connectDb()
        const admin = await Admin.findOne({ email })
        if (!admin) return null
        const ok = await verifyPassword(admin.passwordHash, password)
        if (!ok) return null
        return { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role }
      },
    }),
  ],
})
