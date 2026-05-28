import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com' as string;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const notificationId = params.id

  try {
    const body = await req.json()
    const { status } = body // Skipping other fields for now to alow only status updates

    const authHeader = req.headers.get('Authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const url = `${API_URL}/api/v1/notifications/${notificationId}`
    console.log(`\nHitting ${url} to update notification with status: ${status}\n`)
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    })

    const responseText = await response.text()
    console.log(`Notifications PATCH response status: ${response.status}`)

    let data
    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      console.error('Error parsing JSON response:', e)
      return NextResponse.json({ detail: 'Invalid response from server' }, { status: 500 })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Notifications PATCH proxy error:', error)
    return NextResponse.json(
      { detail: 'An error occurred while updating the notification.' },
      { status: 500 }
    )
  }
}
