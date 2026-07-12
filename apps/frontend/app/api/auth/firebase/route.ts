import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"
const ACCESS_COOKIE = "auth_token"
const REFRESH_COOKIE = "refresh_token"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendRes = await fetch(`${API_URL}/api/v1/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await backendRes.json().catch(() => ({}))

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    const { access_token, refresh_token, is_new_user, user } = data
    const res = NextResponse.json({ is_new_user, user })

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
    return res
  } catch (error) {
    console.error("Firebase proxy error:", error)
    return NextResponse.json({ detail: "Couldn't complete Google sign-in." }, { status: 500 })
  }
}