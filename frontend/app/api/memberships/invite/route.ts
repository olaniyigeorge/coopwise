import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // Get the group_id from the URL parameters
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');

    if (!group_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: group_id' },
        { status: 400 }
      );
    }

    // Get the authorization header exactly as in groups/[id]/route.ts
    const authHeader = request.headers.get('Authorization');
    
    // Return error if no auth header
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No authentication token provided' },
        { status: 401 }
      );
    }
    
    console.log('Using auth header:', authHeader);
    
    // Setup headers same way as in the groups API route
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    // Forward the request to the external API
    const response = await fetch(`${API_URL}/api/v1/memberships/invite?group_id=${group_id}`, {
      method: 'GET',
      headers
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
        { detail: 'Invalid response from server' },
        { status: 500 }
      );
    }

    // Return the API response with appropriate status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error generating invite code:', error);
    return NextResponse.json(
      { error: 'Failed to generate invite code' },
      { status: 500 }
    );
  }
} 