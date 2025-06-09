import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint that always returns a successful response
 * This is used by the keep_alive component to ping the server
 */
export async function GET() {
  // Set cache control headers to prevent caching
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, { headers });
} 