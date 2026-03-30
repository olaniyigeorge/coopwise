// apps/web/app/api/circles/[id]/route.ts  — GET /api/circles/:id
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { resolveBackendUrl } from "@/lib/server/backend-url";

const BACKEND = resolveBackendUrl();

async function backendHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

interface Ctx { params: Promise<{ id: string }> }


export async function GET(
  _req: NextRequest,
  { params }: Ctx
) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/v1/cooperatives/${id}`, {
    headers: await backendHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}