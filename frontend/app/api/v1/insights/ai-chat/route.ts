import { NextRequest, NextResponse } from 'next/server';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('Missing Authorization header in ai-chat API request');
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get prompt from request body or query parameters
    let prompt;
    
    // Try to get from body first
    try {
      const body = await request.json();
      prompt = body.prompt;
    } catch (error) {
      // If body parsing fails, try query parameters
      const { searchParams } = new URL(request.url);
      prompt = searchParams.get('prompt');
    }
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`AI Chat API request with prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);
    
    const endpoint = `${NEXT_PUBLIC_API_URL}/api/v1/insights/ai-chat`;
    console.log(`Calling backend API at: ${endpoint}`);
    
    // Call the real API endpoint with the proper request format
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    console.log(`AI Chat API response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get response as text to see what the error is
      let errorText;
      try {
        errorText = await response.text();
        console.error('AI Chat API error response text:', errorText);
        
        // Try to parse as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          return NextResponse.json(errorJson, { status: response.status });
        } catch (parseError) {
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

    // Get response as text or JSON depending on the content type
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log(`AI Chat API response received`);
    
    // Return the API response
    return new Response(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      {
        headers: {
          'Content-Type': contentType || 'text/plain',
        },
      }
    );
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 