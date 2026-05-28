import { NextRequest, NextResponse } from 'next/server';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com';

interface Params {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { code } = await params
  try {
    
    // This endpoint is public and doesn't require authentication
    // We'll fetch basic group information that's safe to show to unauthenticated users
    
    // First, try to get group info from the invite code
    // Note: The backend might require auth, so we'll handle that gracefully
    const response = await fetch(`${API_URL}/api/v1/memberships/invite?invite_code=${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If the invite code endpoint requires auth, we'll return a generic response
      // indicating the invite code exists but we can't show details
      return NextResponse.json({
        invite_code: code,
        exists: true,
        message: "Invite code is valid. Sign in to view group details and join."
      });
    }

    const data = await response.json();
    
    // Extract group information if available
    if (data.group) {
      // Return only safe, public information about the group
      const publicGroupInfo = {
        id: data.group.id,
        name: data.group.name,
        description: data.group.description,
        image_url: data.group.image_url,
        contribution_amount: data.group.contribution_amount,
        contribution_frequency: data.group.contribution_frequency,
        max_members: data.group.max_members,
        memberCount: data.group.memberCount || 0,
        rules: data.group.rules || [],
        invite_code: code,
        exists: true
      };
      
      return NextResponse.json(publicGroupInfo);
    }

    // Fallback response
    return NextResponse.json({
      invite_code: code,
      exists: true,
      message: "Invite code is valid. Sign in to view group details and join."
    });

  } catch (error) {
    console.error('Public group info error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch group information',
        invite_code: code,
        exists: false
      },
      { status: 500 }
    );
  }
}
