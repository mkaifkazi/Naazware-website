import type { NextAuthConfig } from 'next-auth'

// Edge-safe base config (NO database / native deps) — imported by middleware.
// The real Credentials provider (which touches Mongo + argon2) is added in auth.ts.
export const authConfig = {
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/admin/login' },
  providers: [],
  callbacks: {
    // Route guard used by middleware. Returning false on a protected route makes
    // Auth.js redirect to the signIn page with a callbackUrl automatically.
    authorized: ({ auth, request: { nextUrl } }) => {
      const { pathname } = nextUrl
      if (pathname === '/admin/login') return true
      if (pathname.startsWith('/admin')) return Boolean(auth)
      return true
    },
    jwt: ({ token, user }) => {
      if (user) token.role = (user as { role?: string }).role ?? 'admin'
      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? ''
        ;(session.user as { role?: string }).role = (token.role as string) ?? 'admin'
      }
      return session
    },
  },
} satisfies NextAuthConfig
