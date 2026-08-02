import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Protects every route under the dashboard from unauthenticated access.
// Uses Supabase's session cookie — no manual token handling.
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/accounts',
  '/live-monitor',
  '/player',
  '/analytics',
  '/activity',
  '/settings',
]

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p))

  if (isProtected && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/accounts/:path*',
    '/live-monitor/:path*',
    '/player/:path*',
    '/analytics/:path*',
    '/activity/:path*',
    '/settings/:path*',
  ],
}
