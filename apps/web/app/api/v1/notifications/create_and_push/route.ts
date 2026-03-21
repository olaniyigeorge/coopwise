import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Forward auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authorization header is missing' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestBody = await request.json();

    // Validate required fields
    const requiredFields = ['user_id', 'title', 'message', 'event_type', 'type'];
    for (const field of requiredFields) {
      if (!requestBody[field]) {
        return NextResponse.json(
          { detail: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    // Forward the request to the backend
    const response = await fetch(
      `${API_URL}/api/v1/notifications/create_and_push`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }
    );

    // Handle various response cases
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating notification: ${response.status}`, errorText);
      
      return NextResponse.json(
        { detail: `Error creating notification: ${response.status}` },
        { status: response.status }
      );
    }

    // Parse the response and return to client
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      // If it's just a string response, return it directly
      if (responseText) {
        return NextResponse.json({ message: responseText }, { status: 200 });
      }
      
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
      { detail: 'An error occurred while creating notification' },
      { status: 500 }
    );
  }
} 