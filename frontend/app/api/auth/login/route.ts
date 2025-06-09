import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

// Cookie settings
const COOKIE_NAME = 'auth_token';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    console.log('Login request received:', body);

    // Format the request body for the API
    const formData = new URLSearchParams();
    formData.append('username', body.username);
    formData.append('password', body.password);
    formData.append('grant_type', body.grant_type || 'password');
    // add the "empty" fields exactly as the endpoint expects:
    formData.append('scope',         body.scope || '');
    formData.append('client_id',     body.client_id || '');
    formData.append('client_secret', body.client_secret || '');

    // Call the authentication API
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
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

    // If login was successful, get the user info
    if (data.access_token) {
      try {
        // Fetch user details
        const userResponse = await fetch(`${API_URL}/api/v1/users/me`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Create response with HTTP-only cookie
          const responseObj = NextResponse.json({
            ...data,
            user: userData,
          });
          
          // Set HTTP-only cookie
          responseObj.cookies.set({
            name: COOKIE_NAME,
            value: data.access_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
          });
          
          return responseObj;
        } else {
          // If user fetch fails, still return the token
          console.error('Error fetching user data after login');
          
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
          
          return responseObj;
        }
      } catch (userError) {
        console.error('Error fetching user after login:', userError);
        
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
        
        return responseObj;
      }
    }

    // Return the API response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { detail: 'An error occurred during login.' },
      { status: 500 }
    );
  }
} 