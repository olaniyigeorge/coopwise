// apps/web/app/api/circles/public/[id]/route.ts  — no auth, for invite preview
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
interface Ctx { params: Promise<{ id: string }> }

export async function GET(
  _req: NextRequest,
  { params }: Ctx
) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/v1/circles/public/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}