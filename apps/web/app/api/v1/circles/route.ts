import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  buildLegacyCircleCreatePayload,
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
  const response = await fetch(`${BACKEND_URL}/api/v1/cooperatives/me`, {
    headers: buildBackendHeaders(authHeader),
    cache: "no-store",
  });
  const data = await readJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      data ?? { detail: "Failed to load circles" },
      { status: response.status }
    );
  }

  const circles = Array.isArray(data)
    ? data.map((group) => normalizeCircle(group, { currentUserId }))
    : [];

  return NextResponse.json(circles);
}

export async function POST(request: NextRequest) {
  const authHeader = getAuthHeader(request);

  if (!authHeader) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 }
    );
  }

  const currentUserId = decodeUserIdFromAuthHeader(authHeader);
  if (!currentUserId) {
    return NextResponse.json(
      { detail: "Invalid authentication token" },
      { status: 401 }
    );
  }

  const payload = await request.json();
  const backendPayload = buildLegacyCircleCreatePayload(payload, currentUserId);

  const response = await fetch(`${BACKEND_URL}/api/v1/cooperatives/create`, {
    method: "POST",
    headers: buildBackendHeaders(authHeader),
    body: JSON.stringify(backendPayload),
  });
  const data = await readJsonSafe(response);

  if (!response.ok) {
    return NextResponse.json(
      data ?? { detail: "Failed to create circle" },
      { status: response.status }
    );
  }

  const circle = normalizeCircle(data ?? {}, { currentUserId });

  return NextResponse.json(
    {
      circle_id: circle.id,
      chain_circle_id: circle.chain_circle_id,
      tx_id: data?.tx_id ?? null,
      circle,
    },
    { status: 201 }
  );
}
