import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    console.log('Token API: Cookie token present:', !!token);

    if (!token) {
      console.log('Token API: No auth_token cookie found');
      return NextResponse.json({ token: null, authenticated: false }, { status: 401 });
    }

    // Return the token with a success status
    return NextResponse.json({ 
      token, 
      authenticated: true 
    });
  } catch (error) {
    console.error('Token API error:', error);
    return NextResponse.json({ 
      token: null, 
      authenticated: false, 
      error: 'Failed to retrieve authentication token' 
    }, { status: 500 });
  }
}
