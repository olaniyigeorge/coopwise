import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  decodeUserIdFromAuthHeader,
  getAuthHeader,
  normalizeCircle,
  readJsonSafe,
} from "@/lib/server/circle-contract";

export async function GET(request: NextRequest) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  const currentUserId = decodeUserIdFromAuthHeader(authHeader);
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get("skip") ?? "0";
  const limit = searchParams.get("limit") ?? "20";

  const response = await fetch(
    `${BACKEND_URL}/api/v1/cooperatives/discover?skip=${skip}&limit=${limit}`,
    { headers: buildBackendHeaders(authHeader), cache: "no-store" }
  );
  const data = await readJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      data ?? { detail: "Failed to load open circles" },
      { status: response.status }
    );
  }

  const list = Array.isArray(data)
    ? data.map((g) => normalizeCircle(g, { currentUserId }))
    : [];

  return NextResponse.json(list);
}
