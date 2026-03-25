// apps/web/app/api/circles/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
interface Ctx { params: Promise<{ id: string }> }

export async function GET(
  _req: NextRequest,
  { params }: Ctx 
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const res = await fetch(`${BACKEND}/api/v1/cooperatives/${id}/members`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}