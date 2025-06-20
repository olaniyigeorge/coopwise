import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

interface Params {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authHeader = request.headers.get('Authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${API_URL}/api/v1/notifications/me`, {
      method: 'GET',
      headers,
    });

    const responseText = await response.text();
    console.log(`Notifications API response status: ${response.status}`);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      return NextResponse.json(
        { detail: 'Invalid response from server' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Notifications proxy error:', error);
    return NextResponse.json(
      { detail: 'An error occurred while fetching notifications.' },
      { status: 500 }
    );
  }
}
