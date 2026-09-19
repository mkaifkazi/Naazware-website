import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// Edge-safe middleware instance — uses the base config's `authorized` callback
// to guard /admin routes. No DB / native deps here.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ['/admin/:path*'],
}
