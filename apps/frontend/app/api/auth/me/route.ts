import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"
const ACCESS_COOKIE = "auth_token"

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
  }

  try {
    const backendRes = await fetch(`${API_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!backendRes.ok) {
      return NextResponse.json({ authenticated: false, user: null }, { status: backendRes.status })
    }
    const user = await backendRes.json()
    return NextResponse.json({ authenticated: true, user })
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 })
  }
}