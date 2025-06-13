import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

export async function POST(request: NextRequest) {

  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    console.log('Deposit data:', body);
    
    // Call the API to make deposit
    const response = await fetch(`${API_URL}/api/v1/wallet/deposit/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });

    
    console.log(`Registration API response status: ${response.status}`);
    
    // Get the response data
    const responseData = await response.json();

    // If the response is not ok, return the error
    if (!response.ok) {
      console.error('API error:', responseData);
      return NextResponse.json(responseData, { status: response.status });
    }

    // Return the wallet data
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error making deposit:', error);
    return NextResponse.json(
      { detail: 'An error occurred while making deposit.' },
      { status: 500 }
    );
  }
} 