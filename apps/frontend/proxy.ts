import { NextRequest, NextResponse } from 'next/server'
import { performRefresh, setAuthCookies, clearAuthCookies, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/refresh'
import { isExpiredOrExpiringSoon } from '@/lib/auth/jwt'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDashboard = pathname.startsWith('/dashboard')
  const isProtectedApi = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')

  if (!isDashboard && !isProtectedApi) {
    return NextResponse.next()
  }

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  let refreshed: { access_token: string; refresh_token: string } | null = null
  let refreshFailed = false

  if ((!accessToken || isExpiredOrExpiringSoon(accessToken)) && refreshToken) {
    const result = await performRefresh(refreshToken)
    if (result) {
      accessToken = result.access_token
      refreshed = { access_token: result.access_token, refresh_token: result.refresh_token }
    } else {
      accessToken = undefined
      refreshFailed = true
    }
  }

  const isAuthenticated = !!accessToken && !isExpiredOrExpiringSoon(accessToken)

  if (isDashboard && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('returnUrl', `${pathname}${request.nextUrl.search || ''}`)
    const res = NextResponse.redirect(loginUrl)
    if (refreshFailed) clearAuthCookies(res) // dead refresh token, stop dragging it around
    return res
  }

  if (isProtectedApi) {
    if (!isAuthenticated) {
      const existingAuthHeader = request.headers.get('Authorization')
      if (existingAuthHeader) return NextResponse.next() // let it through, backend will 401 if bad
      const res = NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
      if (refreshFailed) clearAuthCookies(res)
      return res
    }

    const headers = new Headers(request.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
      // NOTE: for methods with a body (POST/PUT/PATCH), the fetch spec wants
      // `duplex: 'half'` set alongside a streaming body under Node/undici.
      // This was already true in your original code — flagging since it's
      // untested here, not something I introduced.
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
    })
    const res = NextResponse.next({ request: modifiedRequest })
    if (refreshed) setAuthCookies(res, refreshed.access_token, refreshed.refresh_token)
    return res
  }

  const res = NextResponse.next()
  if (refreshed) setAuthCookies(res, refreshed.access_token, refreshed.refresh_token)
  return res
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}