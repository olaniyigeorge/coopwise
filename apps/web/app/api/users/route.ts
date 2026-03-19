import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    console.log('User registration request:', body);
    
    // Call the API to register the user
    const response = await fetch(`${API_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response text first
    const responseText = await response.text();
    console.log(`Registration API response status: ${response.status}`);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      return NextResponse.json(
        { detail: 'Invalid response from server', raw_response: responseText },
        { status: 500 }
      );
    }

    // If the response is not ok, return the error
    if (!response.ok) {
      console.error('API error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Return the user data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { detail: 'An error occurred while registering the user.' },
      { status: 500 }
    );
  }
} 