import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Read existing JWT from cookie (may be absent for first-time users)
    const cookieStore = await cookies();
    const existingToken = cookieStore.get("auth_token")?.value ?? null;

    // Forward to FastAPI backend
    const backendRes = await fetch(
      `${BACKEND_URL}/api/v1/auth/crossmint-sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(existingToken && { Authorization: `Bearer ${existingToken}` }),
        },
        body: JSON.stringify(payload),
      }
    );

    console.log(`\n\nBackend response: ${backendRes}\n`)

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ detail: "Backend error" }));
      console.error("[crossmint-sync route] Backend returned:", backendRes.status, error);
      return NextResponse.json(
        { detail: error.detail ?? "Sync failed" },
        { status: backendRes.status }
      );
    }
    
    const data = await backendRes.json();
    const { access_token, user } = data;

    // Build response and set the JWT cookie
    const response = NextResponse.json({ access_token, user }, { status: 200 });

    response.cookies.set("auth_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("[crossmint-sync route] Unexpected error:", err);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
