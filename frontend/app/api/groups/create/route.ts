import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // If no auth header, return unauthorized
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    console.log('Create group request received:', body);

    // Forward the request to the actual API
    const response = await fetch(`${API_URL}/api/v1/cooperatives/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body),
    });

    // Get the response text to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log(`Create Group API response status: ${response.status}`);
    console.log(`Create Group API response body: ${responseText}`);
    
    // If response is 422, return the raw text to debug
    if (response.status === 422) {
      console.error('422 Unprocessable Entity:', responseText);
      return NextResponse.json(
        { 
          detail: 'Invalid data submitted to API', 
          error: responseText,
          submitted_data: body
        },
        { status: 422 }
      );
    }
    
    let data;
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // If parsing fails, return the error
      return NextResponse.json(
        { detail: 'Invalid response from server', raw_response: responseText },
        { status: 500 }
      );
    }

    // Return the API response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Create Group proxy error:', error);
    return NextResponse.json(
      { detail: 'An error occurred while creating the group.' },
      { status: 500 }
    );
  }
} 