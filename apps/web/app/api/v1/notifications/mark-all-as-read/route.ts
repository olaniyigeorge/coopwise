import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com'

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${API_URL}/api/v1/notifications/mark-all-as-read`, {
      method: 'PATCH', 
      headers,
    })

    const responseText = await response.text()
    console.log(`Mark all as read API response status: ${response.status}`)

    let data
    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      console.error('Error parsing JSON response:', e)
      return NextResponse.json({ detail: 'Invalid response from server' }, { status: 500 })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Mark all as read proxy error:', error)
    return NextResponse.json(
      { detail: 'An error occurred while marking notifications as read.' },
      { status: 500 }
    )
  }
}
