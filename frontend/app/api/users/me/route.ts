import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401 }
      );
    }

    console.log('Fetching current user profile');
    
    // Call the API to get user details
    const response = await fetch(`${API_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    // Get the response text first
    const responseText = await response.text();
    console.log(`User me API response status: ${response.status}`);
    
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
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { detail: 'An error occurred while fetching the user profile.' },
      { status: 500 }
    );
  }
} 