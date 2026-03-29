import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  getAuthHeader,
  normalizeCircleHistory,
  readJsonSafe,
} from "@/lib/server/circle-contract";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authHeader = getAuthHeader(request);

  const response = await fetch(`${BACKEND_URL}/api/v1/cooperatives/ext/${id}`, {
    headers: buildBackendHeaders(authHeader),
    cache: "no-store",
  });
  const data = await readJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      data ?? { detail: "Failed to load circle history" },
      { status: response.status }
    );
  }

  return NextResponse.json(normalizeCircleHistory(data ?? {}));
}
