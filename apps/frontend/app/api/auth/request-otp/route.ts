import { NextRequest, NextResponse } from "next/server"
import { clientIpHeadersFrom } from "@/lib/server/backend"
import { jsonWithRetry, readBackendBody } from "@/lib/server/read-backend-body"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendRes = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeadersFrom(request) },
      body: JSON.stringify(body),
    })

    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const { data, retryAfter } = await readBackendBody(backendRes)
    return jsonWithRetry(data, backendRes.status, retryAfter)
  } catch (error) {
    console.error("Request OTP proxy error:", error)
    return NextResponse.json({ detail: "Couldn't send the code. Try again." }, { status: 500 })
  }
}