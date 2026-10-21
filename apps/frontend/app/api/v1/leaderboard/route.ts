import { NextResponse } from "next/server";
import { BACKEND_URL, readJsonSafe } from "@/lib/server/circle-contract";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 10) || 10, 1),
    50
  );

  const response = await fetch(
    `${BACKEND_URL}/api/v1/contributions/leaderboard?limit=${limit}`,
    {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );
  const data = await readJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      data ?? { detail: "Failed to load leaderboard" },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
