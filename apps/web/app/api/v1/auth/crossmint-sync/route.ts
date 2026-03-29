import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  buildBackendHeaders,
  deriveUuidFromString,
  getAuthHeader,
  readJsonSafe,
} from "@/lib/server/circle-contract";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const authHeader = getAuthHeader(request);

  const primaryResponse = await fetch(`${BACKEND_URL}/api/v1/auth/crossmint-sync`, {
    method: "POST",
    headers: buildBackendHeaders(authHeader),
    body: JSON.stringify(payload),
  }).catch(() => null);

  let responseData =
    primaryResponse && (await readJsonSafe(primaryResponse as Response));

  if (!primaryResponse || !primaryResponse.ok) {
    const fallbackPayload = {
      wallet_address: payload.flow_address,
      origin_jwt: payload.crossmint_user_id,
      user_id: deriveUuidFromString(
        String(
          payload.crossmint_user_id ??
            payload.email ??
            payload.flow_address ??
            "coopwise"
        )
      ),
    };

    const fallbackResponse = await fetch(`${BACKEND_URL}/api/v1/auth/camp-sync`, {
      method: "POST",
      headers: buildBackendHeaders(authHeader),
      body: JSON.stringify(fallbackPayload),
    });
    const fallbackData = await readJsonSafe(fallbackResponse);

    if (!fallbackResponse.ok) {
      return NextResponse.json(
        fallbackData ?? { detail: "Failed to sync wallet" },
        { status: fallbackResponse.status }
      );
    }

    responseData = {
      access_token: fallbackData?.access_token ?? fallbackData?.token,
      user: {
        ...(fallbackData?.user ?? {}),
        email: payload.email ?? fallbackData?.user?.email ?? "",
        flow_address: payload.flow_address ?? null,
      },
    };
  }

  const accessToken = responseData?.access_token ?? responseData?.token ?? null;

  if (!accessToken) {
    return NextResponse.json(
      { detail: "Sync succeeded but no access token was returned." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    access_token: accessToken,
    user: {
      ...(responseData?.user ?? {}),
      flow_address: payload.flow_address ?? responseData?.user?.flow_address ?? null,
    },
  });

  response.cookies.set("auth_token", accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
