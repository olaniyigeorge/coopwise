import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"

export const ACCESS_COOKIE = "auth_token"
export const REFRESH_COOKIE = "refresh_token"

type RefreshResult = {
  access_token: string
  refresh_token: string
  user?: unknown
  is_new_user?: boolean
}

export async function performRefresh(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/session/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    if (!data?.access_token || !data?.refresh_token) return null
    return data
  } catch {
    return null
  }
}

export function setAuthCookies(res: NextResponse, access_token: string, refresh_token: string) {
  res.cookies.set({
    name: ACCESS_COOKIE,
    value: access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 15,
    path: "/",
  })
  res.cookies.set({
    name: REFRESH_COOKIE,
    value: refresh_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set({ name: ACCESS_COOKIE, value: "", maxAge: 0, path: "/" })
  res.cookies.set({ name: REFRESH_COOKIE, value: "", maxAge: 0, path: "/" })
}