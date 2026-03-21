import { NextRequest, NextResponse } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl

  // Only run this middleware for API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Get the token from the cookies
    const token = request.cookies.get('auth_token')?.value
    
    // Check for existing Authorization header
    const existingAuthHeader = request.headers.get('Authorization')

    // If there's a token in the cookies, add it to the authorization header
    if (token) {
      console.log(`Middleware: Adding token from cookie to request for ${pathname}`)
      
      // Clone the headers and add/modify the authorization header
      const headers = new Headers(request.headers)
      headers.set('Authorization', `Bearer ${token}`)

      // Create a new request with the modified headers
      const modifiedRequest = new NextRequest(request.url, {
        method: request.method,
        headers,
        body: request.body,
        cache: request.cache,
        credentials: request.credentials,
        integrity: request.integrity,
        keepalive: request.keepalive,
        mode: request.mode,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
      })

      return NextResponse.next({
        request: modifiedRequest,
      })
    } else if (existingAuthHeader) {
      // If there's already an Authorization header, let it pass through
      console.log(`Middleware: Using existing Authorization header for ${pathname}`)
      return NextResponse.next()
    } else {
      console.log(`Middleware: No auth token found for ${pathname}`)
    }
  }

  // Continue with the request unchanged
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
} 