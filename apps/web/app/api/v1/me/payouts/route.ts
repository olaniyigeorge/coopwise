import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.json([]);
}
