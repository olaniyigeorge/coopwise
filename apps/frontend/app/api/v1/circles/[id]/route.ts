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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const authHeader = getAuthHeader(request);
  const currentUserId = decodeUserIdFromAuthHeader(authHeader);

  const [groupResponse, extendedResponse] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/cooperatives/${id}`, {
      headers: buildBackendHeaders(authHeader),
      cache: "no-store",
    }),
    fetch(`${BACKEND_URL}/api/v1/cooperatives/ext/${id}`, {
      headers: buildBackendHeaders(authHeader),
      cache: "no-store",
    }),
  ]);

  const groupData = await readJsonSafe(groupResponse);
  const extendedData = await readJsonSafe(extendedResponse);

  if (!groupResponse.ok) {
    return NextResponse.json(
      groupData ?? { detail: "Circle not found" },
      { status: groupResponse.status }
    );
  }

  const mergedData =
    extendedResponse.ok && extendedData
      ? { ...groupData, ...extendedData }
      : groupData;

  return NextResponse.json(
    normalizeCircle(mergedData ?? {}, { currentUserId })
  );
}
