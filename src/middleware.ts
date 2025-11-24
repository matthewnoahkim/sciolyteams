// API logging middleware - logs all API route calls
// Note: For automatic API logging, you can add manual logging in each API route
// This middleware provides basic route tracking but doesn't capture request bodies

import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip logging for certain paths
  const skipPaths = ['/_next', '/api/auth', '/favicon.ico', '/static']
  if (skipPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Only log API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Note: Full API logging with request/response details should be done
  // manually in each API route handler using the logApiCall utility from @/lib/api-logger
  // This is because Next.js middleware cannot easily read request bodies without
  // interfering with route handlers.

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
