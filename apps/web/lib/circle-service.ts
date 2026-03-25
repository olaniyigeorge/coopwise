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
  id: number;                   
  chain_circle_id: number;       // on-chain UInt64 ID
  name: string;
  creator_id: string;
  member_count: number;
  contribution_amount: number;
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
  group_id: string;
  role: string;
  status: string;
  payout_position: number;          // was queue_position
  has_received_payout_this_cycle: boolean;
  joined_at: string | null;

  full_name: string;
  username: string;
  profile_picture_url: string | null;
  flow_address: string | null;
  is_email_verified: boolean;

  has_contributed_this_round: boolean;
}

export interface CircleHistoryEntry {
  contribution_id: string;
  amount: number;
  currency: string;
  status: string;                   // "pledged" | "completed" | etc.
  note: string | null;
  due_date: string | null;
  fulfilled_at: string | null;
  created_at: string;

  member_name: string;
  member_address: string | null;
  explorer_url: string | null;      // null until tx_id column is added
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
      "/api/circles",
      data,
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Join an existing circle by its Postgres ID.
   * Returns tx_id — call `waitForTx(tx_id)` after this.
   */
  async joinCircle(circleId: string): Promise<JoinCircleResponse> {
    const response = await axios.post<JoinCircleResponse>(
      `/api/circles/${circleId}/join`,
      {},
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  /** Get full circle details including member list and queue position */
  async getCircle(circleId: string): Promise<Circle> {
    const response = await axios.get<Circle>(`/api/circles/${circleId}`); 
    return response.data;
  },

  /** Get all members and their contribution status for the current round */
  async getCircleMembers(circleId: string): Promise<CircleMember[]> {
    const response = await axios.get<CircleMember[]>(`/api/circles/${circleId}/members`);
    return response.data;
  },

  /** Get full contribution history for the circle (no amounts — only counts + tx links) */
  async getCircleHistory(circleId: string): Promise<CircleHistoryEntry[]> {
    const response = await axios.get<CircleHistoryEntry[]>(`/api/circles/${circleId}/history`);
    return response.data;
  },

  /** Get all circles the current user belongs to */
  async getMyCircles(): Promise<Circle[]> {
    const response = await axios.get<Circle[]>("/api/circles");  // was /api/v1/circles/me
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
