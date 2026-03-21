import { NextResponse } from 'next/server'


// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';


export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log('Camp sync data:', data)
    
    // OPTION 1: Try with the actual backend
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/camp-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({wallet_address: data.walletAddress, origin_jwt: data.originJwt, user_id: data.userId}),
      })
      
      console.log('Response status:', res.status)
      
      let responseData
      try {
        responseData = await res.json()
        console.log('Response data:', responseData)
      } catch {
        const text = await res.text()
        console.log('Response text:', text)
        responseData = { message: text }
      }

      console.log('Setting User:', responseData.user)
      console.log('Setting token...', responseData.token)
      console.log('Setting wallet...', responseData.wallet)


      // Set HttpOnly cookie
      const response = NextResponse.json(responseData, { status: res.status });
      response.cookies.set("access_token", responseData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 5, //TODO Accept remmeber me this deep down and set maxAge to a 3 days instead
      });
      response.cookies.set("user", JSON.stringify(responseData.user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 5, //TODO Accept remmeber me this deep down and set maxAge to a 3 days instead
      });
      response.cookies.set("wallet", JSON.stringify(responseData.wallet), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 5, //TODO Accept remmeber me this deep down and set maxAge to a 3 days instead
    });
      return response;

    } catch (backendError) {
      console.error('Backend error:', backendError)
      
      // OPTION 2: If the backend is down, return a mock success response for testing
      console.log('Returning mock response for testing')
      
      // Generate a random UUID for the user ID
      const mockUserId = 'test-' + Math.random().toString(36).substring(2, 15)
      
      return NextResponse.json({
        token: "mock_token_for_testing_" + Date.now(),
        user: {
          id: mockUserId,
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          phone_number: data.phone_number,
          role: data.role || "user",
          target_savings_amount: data.target_savings_amount || null,
          savings_purpose: data.savings_purpose || null,
          income_range: data.income_range || null,
          saving_frequency: data.saving_frequency || null,
          is_email_verified: false,
          is_phone_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }, { status: 200 })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user. Please try again later.' },
      { status: 500 }
    )
  }
} 