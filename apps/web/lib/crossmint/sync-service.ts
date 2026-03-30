/**
 * Crossmint → CoopWise Backend Sync Service
 *
 * After Crossmint authenticates a user and provisions their Flow smart wallet,
 * we sync that data to our FastAPI backend so we can:
 *   - Create/find the user in Postgres
 *   - Link their Flow address to the user record
 *   - Receive back our own JWT for subsequent API calls
 *
 * Proxied by Next.js:
 *   POST /api/v1/auth/crossmint-sync
 *   Body: { crossmint_user_id, email, flow_address }
 *   Response: { access_token, user: { id, email, full_name, flow_address, ... } }
 */

import axios from "axios";
import CookieService from "@/lib/cookie-service";

export interface CrossmintSyncPayload {
  crossmint_user_id: string;
  email: string;
  flow_address: string;
  wallet_provider: string
}

export interface CrossmintSyncResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    username: string;
    phone_number: string;
    role: string;
    flow_address: string;
    [key: string]: any;
  };
}

/**
 * Called immediately after Crossmint login + wallet creation.
 * Sends the Crossmint user ID, email, and Flow address to our backend.
 * Backend creates/finds the user and returns a JWT + user object.
 */
export async function syncCrossmintUser(
  payload: CrossmintSyncPayload
): Promise<CrossmintSyncResponse> {
  const response = await axios.post<CrossmintSyncResponse>(
    "/api/v1/auth/crossmint-sync",
    payload
  );

  const { access_token, user } = response.data;

  // Store the JWT in a cookie (same mechanism as the legacy auth)
  CookieService.setToken(access_token, true);

  return { access_token, user };
}

/**
 * Fetches a passkey challenge from the backend.
 * The challenge is a random nonce the backend generates so we can create
 * a verifiable WebAuthn credential tied to this server session.
 *
 * Backend endpoint needed:
 *   GET /api/v1/auth/passkey-challenge
 *   Response: { challenge: string (hex) }
 */
export async function fetchPasskeyChallenge(): Promise<Uint8Array> {
  const response = await axios.get<{ challenge: string }>(
    "/api/v1/auth/passkey-challenge"
  );
  // Decode hex string → Uint8Array
  const hex = response.data.challenge;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
