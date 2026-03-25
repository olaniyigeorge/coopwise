// apps/web/app/api/circles/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
interface Ctx { params: Promise<{ id: string }> }

export async function POST(
  _req: NextRequest,
  { params }: Ctx
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND}/api/v1/circles/${id}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}