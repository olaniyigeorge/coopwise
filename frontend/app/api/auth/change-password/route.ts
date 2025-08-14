import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = body?.token as string
    const new_password = body?.new_password as string

    if (!token || !new_password) {
      return NextResponse.json({ detail: 'token and new_password are required' }, { status: 400 })
    }

    const res = await fetch(`${API_URL}/api/v1/auth/change-password?token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(new_password)}`, {
      method: 'POST'
    })

    const text = await res.text()
    let data: any = {}
    try { data = text ? JSON.parse(text) : {} } catch {}

    if (!res.ok) {
      return NextResponse.json(data || { detail: 'Failed to change password' }, { status: res.status })
    }

    return NextResponse.json(data || { status: 'success' })
  } catch (e) {
    return NextResponse.json({ detail: 'Unexpected error' }, { status: 500 })
  }
}



