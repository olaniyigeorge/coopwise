import { NextRequest, NextResponse } from "next/server";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(`${API}/api/v1/insights/ai-chat/history`, {
    headers: { Authorization: auth },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(`${API}/api/v1/insights/ai-chat/history`, {
    method: "DELETE",
    headers: { Authorization: auth },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
