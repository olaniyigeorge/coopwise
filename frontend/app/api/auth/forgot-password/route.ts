import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = body?.email as string
    if (!email) {
      return NextResponse.json({ detail: 'Email is required' }, { status: 400 })
    }

    const res = await fetch(`${API_URL}/api/v1/auth/forgot-password?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    })

    const text = await res.text()
    let data: any = {}
    try { data = text ? JSON.parse(text) : {} } catch {}

    if (!res.ok) {
      return NextResponse.json(data || { detail: 'Failed to send reset link' }, { status: res.status })
    }

    return NextResponse.json(data || { message: 'Password reset link sent' })
  } catch (e) {
    return NextResponse.json({ detail: 'Unexpected error' }, { status: 500 })
  }
}



