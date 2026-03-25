import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // 1. Get the JWT from cookies to authorize the request to FastAPI
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Forward the payload to the FastAPI backend
    console.log(`\n Payload: \n`, payload, "\n")
    const backendRes = await fetch(
      `${BACKEND_URL}/api/v1/cooperatives/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // 3. Handle Backend Errors
    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({ 
        detail: "Backend failed to create circle" 
      }));
      
      console.error("[cooperative-create] Backend Error:", backendRes.status, errorData);
      
      return NextResponse.json(
        { detail: errorData.detail ?? "Failed to create circle" },
        { status: backendRes.status }
      );
    }

    // 4. Return the CoopGroupDetails object to the frontend
    const data = await backendRes.json();
    
    console.log(`[cooperative-create] Success! Circle ID: ${data.id}`);

    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    console.error("[cooperative-create] Unexpected Error:", err);
    return NextResponse.json(
      { detail: "Internal server error connecting to backend" },
      { status: 500 }
    );
  }
}


async function backendHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}


export async function GET() {
  const res = await fetch(`${BACKEND_URL}/api/v1/circles/me`, {
    headers: await backendHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}