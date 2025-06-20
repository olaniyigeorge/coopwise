import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const page_size = searchParams.get('page_size') || '20';

    // Forward auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    // Forward the request to the backend
    const response = await fetch(
      `${API_URL}/api/v1/notifications/me?page=${page}&page_size=${page_size}`, 
      {
        method: 'GET',
        headers,
      }
    );

    // Handle various response cases
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching notifications: ${response.status}`, errorText);
      
      return NextResponse.json(
        { detail: `Error fetching notifications: ${response.status}` },
        { status: response.status }
      );
    }

    // Parse the response and return to client
    const responseText = await response.text();
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

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { detail: 'An error occurred while fetching notifications' },
      { status: 500 }
    );
  }
} 