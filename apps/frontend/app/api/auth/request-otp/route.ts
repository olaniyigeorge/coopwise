import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendRes = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    // 204/205/304 must not have a body
    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("Request OTP proxy error:", error)
    return NextResponse.json({ detail: "Couldn't send the code. Try again." }, { status: 500 })
  }
}