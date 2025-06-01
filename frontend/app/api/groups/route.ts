import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the actual API without pagination parameters
    const response = await fetch(`${API_URL}/api/v1/cooperatives`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('Authorization') 
          ? { 'Authorization': request.headers.get('Authorization') as string } 
          : {})
      },
    });

    // Get the response text to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log(`Groups API response status: ${response.status}`);
    
    let data;
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : [];
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // If parsing fails, return an empty array
      return NextResponse.json([], { status: 200 });
    }

    // Return the API response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Groups proxy error:', error);
    // Return empty array on error to prevent UI breaks
    return NextResponse.json([], { status: 200 });
  }
} 