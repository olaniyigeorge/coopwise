import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL  || 'https://coopwise.onrender.com' || "http://localhost:8000";

// Cookie settings
const COOKIE_NAME = 'auth_token';
const REFRESH_COOKIE_NAME = 'refresh_token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Login request received:', body);

    // Call the authentication API
    console.log(`Sending login request to Auth API ${API_URL}/api/v1/auth/dev-sign-in`);
    const response = await fetch(`${API_URL}/api/v1/auth/dev-sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response text to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log(`Auth API response status: ${response.status}`);
    
    let data;
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // If parsing fails, return the raw text
      return NextResponse.json(
        { detail: 'Invalid response from authentication server', raw_response: responseText },
        { status: 500 }
      );
    }

    // If login was not successful, pass through the error
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // {access_token, refresh_token, token_type, is_new_user, user}
    // If login was successful, get the user info
    if (data.access_token) {
      // Create response with HTTP-only cookie
      const responseObj = NextResponse.json(data);
        
      // Set HTTP-only cookie
      responseObj.cookies.set({
        name: COOKIE_NAME,
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      responseObj.cookies.set({
        name: REFRESH_COOKIE_NAME,
        value: data.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 14, // 14 days
        path: '/'
      });
      
      return responseObj;
    } else {
      console.log("Invalide respose shape")
      return NextResponse.json(data);
    }
    
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { detail: 'An error occurred during login.' },
      { status: 500 }
    );
  }
} 