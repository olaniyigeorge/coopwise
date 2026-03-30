import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  decodeUserIdFromAuthHeader,
  getAuthHeader,
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
  if (!currentUserId) {
    return NextResponse.json(
      { detail: "Invalid authentication token" },
      { status: 401 }
    );
  }

  const [groupResponse, body] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/cooperatives/${id}`, {
      headers: buildBackendHeaders(authHeader),
      cache: "no-store",
    }),
    request.json().catch(() => ({})),
  ]);
  const groupData = await readJsonSafe(groupResponse);

  if (!groupResponse.ok) {
    return NextResponse.json(
      groupData ?? { detail: "Circle not found" },
      { status: groupResponse.status }
    );
  }

  const contributionPayload = {
    user_id: currentUserId,
    group_id: id,
    amount:
      Number(groupData?.contribution_amount ?? 0) ||
      Number(groupData?.weekly_amount_local ?? 0),
    currency: groupData?.currency ?? "NGN",
    due_date: null,
    note:
      typeof body?.note === "string" && body.note.trim()
        ? body.note.trim()
        : "Circle contribution",
    status: "completed",
  };

  const contributionResponse = await fetch(
    `${BACKEND_URL}/api/v1/contributions/contribute`,
    {
      method: "POST",
      headers: buildBackendHeaders(authHeader),
      body: JSON.stringify(contributionPayload),
    }
  );
  const contributionData = await readJsonSafe(contributionResponse);

  if (!contributionResponse.ok) {
    return NextResponse.json(
      contributionData ?? { detail: "Failed to contribute" },
      { status: contributionResponse.status }
    );
  }

  return NextResponse.json({
    mode: "legacy",
    tx_id: null,
    explorer_url: null,
    contribution_id: contributionData?.contribution?.id ?? null,
    message:
      contributionData?.message ?? "Contribution recorded successfully.",
  });
}
