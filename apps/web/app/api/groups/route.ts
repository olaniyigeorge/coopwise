import { NextRequest, NextResponse } from 'next/server';



// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';


export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Call the real API endpoint
    const response = await fetch(`${API_URL}/api/v1/cooperatives/`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Get response as text first to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log(`Groups API response status: ${response.status}`);
    
    let data;
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : [];
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // If parsing fails, return the raw text
      return NextResponse.json(
        { error: 'Invalid response from server', raw_response: responseText },
        { status: 500 }
      );
    }

    // If request was not successful, pass through the error
    if (!response.ok) {
      console.error('Groups API error response:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Return the API response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Groups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 