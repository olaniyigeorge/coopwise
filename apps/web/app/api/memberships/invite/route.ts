import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');
    const invite_code = searchParams.get('invite_code');

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Return error if no auth header
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized: No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Setup headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    let apiUrl;
    
    // Determine if we're generating or verifying an invite code
    if (invite_code) {
      // Verifying an invite code
      console.log('Verifying invite code:', invite_code);
      apiUrl = `${API_URL}/api/v1/memberships/invite?invite_code=${invite_code}`;
    } else if (group_id) {
      // Generating an invite code
      console.log('Generating invite code for group:', group_id);
      
      // Support for specific test group ID
      if (group_id === 'ad75064d-591a-451e-8a75-508713ffc978') {
        console.log('Using test group ID: ad75064d-591a-451e-8a75-508713ffc978');
      }
      
      apiUrl = `${API_URL}/api/v1/memberships/invite?group_id=${group_id}`;
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: either group_id or invite_code must be provided' },
        { status: 400 }
      );
    }

    // Forward the request to the external API
    const response = await fetch(apiUrl, {
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
    console.error('Error handling invite code request:', error);
    return NextResponse.json(
      { error: 'Failed to process invite code request' },
      { status: 500 }
    );
  }
} 