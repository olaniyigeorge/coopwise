import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Return error if no auth header
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    if (!body.invite_code) {
      return NextResponse.json(
        { error: 'Missing required parameter: invite_code' },
        { status: 400 }
      );
    }
    
    console.log('Accepting invite code:', body.invite_code);
    
    // Setup headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    // Forward the request to the external API with invite_code as a query parameter
    const response = await fetch(`${API_URL}/api/v1/memberships/accept-invite?invite_code=${encodeURIComponent(body.invite_code)}`, {
      method: 'POST',
      headers,
      // No body needed as we're sending the invite_code as a query parameter
    });
    
    // Debug - log response status
    console.log('External API response status:', response.status);
    
    // Get the response text to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
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

    // Return the API response with appropriate status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error accepting invite code:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite code' },
      { status: 500 }
    );
  }
} 