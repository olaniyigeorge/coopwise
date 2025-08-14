import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ detail: 'token is required' }, { status: 400 })
    }
    const res = await fetch(`${API_URL}/api/v1/auth/confirm-reset-password?token=${encodeURIComponent(token)}`)
    const text = await res.text()
    let data: any = {}
    try { data = text ? JSON.parse(text) : {} } catch {}
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ detail: 'Unexpected error' }, { status: 500 })
  }
}



