import { NextRequest, NextResponse } from 'next/server';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('Missing Authorization header in insights API request');
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get margin from query parameters (default to 4 if not provided)
    const { searchParams } = new URL(request.url);
    const margin = searchParams.get('margin') || '4';
    
    console.log(`Insights API request with margin: ${margin}`);
    
    const endpoint = `${NEXT_PUBLIC_API_URL}/api/v1/insights?margin=${margin}`;
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

    console.log(`Insights API response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get response as text to see what the error is
      let errorText;
      try {
        errorText = await response.text();
        console.error('Insights API error response text:', errorText);
        
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
    console.log(`Insights API response data received`);
    
    // Return the API response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 