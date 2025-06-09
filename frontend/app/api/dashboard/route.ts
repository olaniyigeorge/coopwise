import { NextRequest, NextResponse } from 'next/server';



const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const endpoint = `${NEXT_PUBLIC_API_URL}/api/v1/dashboard`
    // Call the real API endpoint
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Get response as text first to handle potential JSON parsing errors
    const responseJson = await response.json();
    console.log(`Dashboard API response status: ${response.status}`);
    console.log(`Dashboard API response data: ${response}`);
    
    // let data;
    // try {
    //   // Try to parse the response as JSON
    //   data = responseText ? JSON.parse(responseText) : {};
    // } catch (e) {
    //   console.error('Error parsing JSON response:', e);
    //   // If parsing fails, return the raw text
    //   return NextResponse.json(
    //     { error: 'Invalid response from server', raw_response: responseText },
    //     { status: 500 }
    //   );
    // }

    // If request was not successful, pass through the error
    if (!response.ok) {
      console.error('Dashboard API error response:', responseJson);
      return NextResponse.json(responseJson, { status: response.status });
    }

    // Return the API response
    return NextResponse.json(responseJson);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 