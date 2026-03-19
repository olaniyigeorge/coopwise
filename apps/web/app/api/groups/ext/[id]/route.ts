import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // For group details, we'll try even without auth, but ideally should have it
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward the request to the actual API
    const response = await fetch(`${API_URL}/api/v1/cooperatives/ext/${id}`, {
      method: 'GET',
      headers,
    });

    // Get the response text to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log(`Group Details API response status: ${response.status}`);
    
    let data;
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // If parsing fails, return the error
      return NextResponse.json(
        { detail: 'Invalid response from server' },
        { status: 500 }
      );
    }

    // Return the API response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Group Details proxy error:', error);
    return NextResponse.json(
      { detail: 'An error occurred while fetching group details.' },
      { status: 500 }
    );
  }
} 