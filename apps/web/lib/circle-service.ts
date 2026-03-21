/**
 * Circle Service — Feature 2 (Join or Create a Circle) + Feature 3 (Contribute)
 *
 * This service wraps the new /api/v1/circles backend endpoints.
 * After the backend creates or joins a circle on-chain, it returns a Flow
 * transaction ID (tx_id). We poll that tx_id using FCL until it seals
 * (~5 seconds on testnet) before redirecting the user.
 *
 * What the BACKEND does (not our job):
 *   - Submits CreateCircle.cdc / JoinCircle.cdc Cadence transactions
 *   - Returns the Flow tx_id
 *
 * What WE do (frontend):
 *   - Call the REST endpoints
 *   - Watch tx_id via fcl.tx().onceSealed() for UX feedback
 *   - Display the result
 */

import axios from "axios";
import * as fcl from "@onflow/fcl";
import AuthService from "./auth-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateCirclePayload {
  name: string;
  /** Phone numbers of invited members (without creator) e.g. ["+2348012345678"] */
  member_phones: string[];
  /** Amount the user enters in their local currency */
  weekly_amount_local: number;
  /** ISO currency code e.g. "NGN", "KES", "GHS" */
  currency: string;
  payout_schedule: "weekly" | "biweekly" | "monthly";
  rotation_order: "sequential" | "random";
}

export interface Circle {
  id: number;                    // Postgres ID
  chain_circle_id: number;       // on-chain UInt64 ID
  name: string;
  creator_id: string;
  member_count: number;
  weekly_amount_local: number;
  currency: string;
  weekly_amount_usdc: number;
  payout_schedule: string;
  rotation_order: string;
  current_round: number;
  is_complete: boolean;
  next_payout_date: string | null;
  your_position_in_queue: number | null;
  /** Flow address of the member whose turn it is to receive the payout this round */
  current_winner: string | null;
  created_at: string;
}

export interface CircleMember {
  user_id: string;
  full_name: string;
  flow_address: string;
  queue_position: number;
  /** Whether this member has contributed in the current round */
  has_contributed_this_round: boolean;
}

export interface CircleHistoryEntry {
  member_name: string;
  member_address: string;
  round: number;
  submitted_at: string;
  tx_id: string;
  /** Link to flowscan.io — shows the encrypted ciphertext, not the amount */
  explorer_url: string;
}

export interface CreateCircleResponse {
  circle_id: number;
  chain_circle_id: number;
  /** Flow transaction ID — we poll this until sealed */
  tx_id: string;
}

export interface JoinCircleResponse {
  tx_id: string;
  status: "joined";
}

// ─── API calls ───────────────────────────────────────────────────────────────

const CircleService = {
  /**
   * Create a new circle.
   * Returns tx_id — call `waitForTx(tx_id)` after this to wait for on-chain confirmation.
   */
  async createCircle(data: CreateCirclePayload): Promise<CreateCircleResponse> {
    const response = await axios.post<CreateCircleResponse>(
      "/api/v1/circles",
      data,
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Join an existing circle by its Postgres ID.
   * Returns tx_id — call `waitForTx(tx_id)` after this.
   */
  async joinCircle(circleId: number): Promise<JoinCircleResponse> {
    const response = await axios.post<JoinCircleResponse>(
      `/api/v1/circles/${circleId}/join`,
      {},
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  /** Get full circle details including member list and queue position */
  async getCircle(circleId: number): Promise<Circle> {
    const response = await axios.get<Circle>(`/api/v1/circles/${circleId}`, {
      headers: AuthService.getAuthHeader(),
    });
    return response.data;
  },

  /** Get all members and their contribution status for the current round */
  async getCircleMembers(circleId: number): Promise<CircleMember[]> {
    const response = await axios.get<CircleMember[]>(
      `/api/v1/circles/${circleId}/members`,
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  /** Get full contribution history for the circle (no amounts — only counts + tx links) */
  async getCircleHistory(circleId: number): Promise<CircleHistoryEntry[]> {
    const response = await axios.get<CircleHistoryEntry[]>(
      `/api/v1/circles/${circleId}/history`,
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  /** Get all circles the current user belongs to */
  async getMyCircles(): Promise<Circle[]> {
    const response = await axios.get<Circle[]>("/api/v1/circles/me", {
      headers: AuthService.getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Poll a Flow transaction until it seals on-chain.
   * This usually takes 5–15 seconds on testnet.
   * Throws if the transaction fails or reverts.
   *
   * Usage:
   *   const { tx_id } = await CircleService.createCircle(...)
   *   await CircleService.waitForTx(tx_id)
   *   // now safe to redirect
   */
  async waitForTx(txId: string): Promise<void> {
    await fcl.tx(txId).onceSealed();
  },
};

export default CircleService;
