import { NextRequest, NextResponse } from 'next/server';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('Missing Authorization header in dashboard API request');
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    console.log('Dashboard API request with auth header:', authHeader.substring(0, 15) + '...');
    
    const endpoint = `${NEXT_PUBLIC_API_URL}/api/v1/dashboard`;
    console.log(`Calling backend API at: ${endpoint}`);
    
    // Call the real API endpoint
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    console.log(`Dashboard API response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get response as text to see what the error is
      let errorText;
      try {
        errorText = await response.text();
        console.error('Dashboard API error response text:', errorText);
        
        // Try to parse as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          return NextResponse.json(errorJson, { status: response.status });
        } catch {
          // If not JSON, return as plain error
          return NextResponse.json(
            { error: 'Backend API error', message: errorText },
            { status: response.status }
          );
        }
      } catch (textError) {
        console.error('Could not read error response as text:', textError);
        return NextResponse.json(
          { error: 'Backend API error', status: response.status },
          { status: response.status }
        );
      }
    }

    // Get response as JSON
    const responseData = await response.json();
    console.log(`Dashboard API response data received, keys:`, Object.keys(responseData));
    
    // Return the API response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 