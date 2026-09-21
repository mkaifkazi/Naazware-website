import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

const CANONICAL_HOST = 'naazware.com'

// Runs on every route (see matcher). Two jobs:
//  1. Canonical-domain 301: any naazware host that isn't the apex .com
//     (naazware.in, www.naazware.in, www.naazware.com) -> https://naazware.com,
//     preserving path + query. Keeps SEO on one canonical origin.
//  2. Delegates to Auth.js, whose `authorized` callback guards /admin.
export default auth((req) => {
  const host = (req.headers.get('host') ?? '').toLowerCase()

  // Only redirect real naazware domains; leave localhost + the *.onrender.com
  // origin + anything else untouched (no redirect loop on the apex itself).
  if (host && host !== CANONICAL_HOST && /(^|\.)naazware\.(in|com)$/.test(host)) {
    const url = req.nextUrl.clone()
    url.protocol = 'https'
    url.host = CANONICAL_HOST
    url.port = ''
    return NextResponse.redirect(url, 301)
  }

  // Admin guard (mirrors authConfig.authorized): unauthenticated /admin -> login.
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !req.auth) {
    const login = req.nextUrl.clone()
    login.pathname = '/admin/login'
    login.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
})

export const config = {
  // All routes except Next internals + static asset files (those never need a
  // host redirect or an auth check, and skipping them keeps the edge cheap).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
}
