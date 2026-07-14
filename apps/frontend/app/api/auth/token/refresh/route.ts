import { NextRequest, NextResponse } from 'next/server'
import { performRefresh, setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth/refresh'

export async function POST(req: NextRequest) {
  const currentRefreshToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (!currentRefreshToken) {
    return NextResponse.json({ detail: 'No refresh token' }, { status: 401 })
  }

  const result = await performRefresh(currentRefreshToken)
  if (!result) {
    const res = NextResponse.json({ detail: 'Refresh failed' }, { status: 401 })
    clearAuthCookies(res)
    return res
  }

  const { access_token, refresh_token, is_new_user, user } = result
  const res = NextResponse.json({ is_new_user, user }) 
  setAuthCookies(res, access_token, refresh_token)
  return res
}