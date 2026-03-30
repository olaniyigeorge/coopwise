import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  decodeUserIdFromAuthHeader,
  getAuthHeader,
  normalizeCircle,
  readJsonSafe,
} from "@/lib/server/circle-contract";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authHeader = getAuthHeader(request);

  if (!authHeader) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = decodeUserIdFromAuthHeader(authHeader);
  const response = await fetch(`${BACKEND_URL}/api/v1/cooperatives/${id}/join`, {
    method: "POST",
    headers: buildBackendHeaders(authHeader),
    body: JSON.stringify({}),
  });
  const data = await readJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      data ?? { detail: "Failed to join circle" },
      { status: response.status }
    );
  }

  const circle =
    data && typeof data === "object" && "id" in data
      ? normalizeCircle(data as Record<string, unknown>, { currentUserId })
      : null;

  return NextResponse.json({
    tx_id:
      data && typeof data === "object" && "tx_id" in data
        ? data.tx_id
        : null,
    status:
      data && typeof data === "object" && "status" in data
        ? data.status
        : "joined",
    circle,
  });
}
