import { NextRequest, NextResponse } from 'next/server';

// The API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

// Configuration - set to false for production
const ENABLE_MOCK_API = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true' || false;

// Mock PATCH response
const mockPatchResponse = (userId: string, body: any) => {
  // Create a response with the same data but add an id
  const responseData = {
    ...body,
    id: userId,
    updated_at: new Date().toISOString()
  };
  
  console.log('Mock API returning:', responseData);
  
  return NextResponse.json(responseData);
};

// PATCH request handler for user update
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Extract resource_owner_id from body or use userId as default
    const resourceOwnerId = body.resource_owner_id || userId;
    
    // Clean the request body - remove any fields that are not expected by the API
    // Only include fields from the UserUpdate schema
    const cleanBody = {
      id: userId,
      username: body.username,
      email: body.email,
      full_name: body.full_name,
      phone_number: body.phone_number,
      role: body.role,
      target_savings_amount: body.target_savings_amount,
      savings_purpose: body.savings_purpose,
      income_range: body.income_range,
      saving_frequency: body.saving_frequency,
      is_email_verified: body.is_email_verified !== undefined ? body.is_email_verified : false,
      is_phone_verified: body.is_phone_verified !== undefined ? body.is_phone_verified : false,
      created_at: body.created_at || new Date().toISOString(),
      updated_at: body.updated_at || new Date().toISOString()
    };
    
    console.log(`Proxying PATCH request to ${API_URL}/api/v1/users/${userId} with body:`, cleanBody);
    
    // According to API docs, user_id is path parameter and resource_owner_id is query parameter
    const url = `${API_URL}/api/v1/users/${userId}?resource_owner_id=${resourceOwnerId}`;
    console.log(`Request URL: ${url}`);
    
    // Make the request to the API
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(cleanBody),
    });
    
    // Get the response text first to debug any issues
    const responseText = await response.text();
    console.log(`API response status: ${response.status}, body:`, responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      data = { detail: responseText || 'Invalid response from server' };
    }
    
    // If the response is not ok, return the error with more details
    if (!response.ok) {
      console.error('API error:', data);
      console.error('Request URL:', url);
      console.error('Request body:', cleanBody);
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { detail: 'An error occurred while updating the user.' },
      { status: 500 }
    );
  }
}

// GET request handler for user retrieval
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401 }
      );
    }
    
    console.log(`Fetching user data from ${API_URL}/api/v1/users/${userId}`);
    
    // Make the request to the API
    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });
    
    // Get the response text first
    const responseText = await response.text();
    console.log(`API response status: ${response.status}, body:`, responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      data = { detail: responseText || 'Invalid response from server' };
    }
    
    // If the response is not ok, return the error
    if (!response.ok) {
      console.error('API error:', data);
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error retrieving user:', error);
    return NextResponse.json(
      { detail: 'An error occurred while retrieving the user.' },
      { status: 500 }
    );
  }
} 