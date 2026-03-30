/**
 * Circle Service — calls Next.js `/api/v1/circles/*` handlers that normalize
 * FastAPI cooperative payloads (see `lib/server/circle-contract.ts`).
 * Legacy cookie-based routes under `/api/circles/*` remain for invite flows.
 */

import axios from "axios";
import * as fcl from "@onflow/fcl";
import AuthService from "./auth-service";

const V1 = "/api/v1/circles";

export interface CreateCirclePayload extends Record<string, unknown> {
  name: string;
  member_phones?: string[];
  weekly_amount_local?: number;
  contribution_amount?: number;
  currency?: string;
  payout_schedule?: string;
  contribution_frequency?: string;
  rotation_order?: string;
  description?: string | null;
  max_members?: number;
  coop_model?: string;
  payout_strategy?: string;
  target_amount?: number;
  status?: string;
}

export interface Circle {
  id: string;
  chain_circle_id: number;
  name: string;
  creator_id: string;
  description?: string | null;
  member_count: number;
  contribution_amount: number;
  weekly_amount_local: number;
  currency: string;
  weekly_amount_usdc: number;
  payout_schedule: string;
  rotation_order: string;
  current_round: number;
  is_complete: boolean;
  next_payout_date: string | null;
  your_position_in_queue: number | null;
  current_winner: string | null;
  created_at: string;
}

export interface CircleMember {
  user_id: string;
  group_id?: string;
  full_name: string;
  username?: string | null;
  profile_picture_url?: string | null;
  flow_address: string | null;
  role?: string;
  status?: string;
  payout_position: number;
  queue_position?: number;
  has_contributed_this_round: boolean;
  has_received_payout_this_cycle?: boolean;
  joined_at?: string | null;
}

export interface CircleHistoryEntry {
  contribution_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  note?: string | null;
  due_date?: string | null;
  fulfilled_at?: string | null;
  created_at?: string;
  member_name: string;
  member_address: string | null;
  round: number;
  submitted_at?: string;
  tx_id: string;
  explorer_url: string | null;
}

export interface PublicCirclePreview {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  contribution_amount: number;
  currency: string;
  contribution_frequency: string;
  payout_schedule: string | null;
  max_members: number;
  member_count: number;
  status: string;
  coop_model: string;
  exists: boolean;
}

export interface CreateCircleResponse {
  circle_id: string;
  chain_circle_id: number;
  tx_id: string | null;
  circle?: Circle;
}

export interface JoinCircleResponse {
  tx_id: string | null;
  status: string;
  circle?: Circle | null;
}

const API_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "https://coopwise.onrender.com";

const CircleService = {
  async createCircle(data: CreateCirclePayload): Promise<CreateCircleResponse> {
    const response = await axios.post<CreateCircleResponse>(`${V1}`, data, {
      headers: AuthService.getAuthHeader(),
    });
    return response.data;
  },

  async joinCircle(circleId: string): Promise<JoinCircleResponse> {
    const response = await axios.post<JoinCircleResponse>(
      `${V1}/${circleId}/join`,
      {},
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  async generateInviteLink(
    circleId: string
  ): Promise<{ invite_code: string; invite_link: string }> {
    const response = await axios.post(`/api/circles/${circleId}/invite`, {});
    return response.data;
  },

  async getPublicCircle(circleId: string): Promise<Circle | null> {
    try {
      const res = await fetch(
        `${API_URL}/api/v1/cooperatives/public/${circleId}`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCircle(circleId: string): Promise<Circle> {
    const response = await axios.get<Circle>(`${V1}/${circleId}`, {
      headers: AuthService.getAuthHeader(),
    });
    return response.data;
  },

  async getPublicCircleByInvite(
    inviteCode: string
  ): Promise<PublicCirclePreview | null> {
    try {
      const res = await fetch(
        `${API_URL}/api/v1/cooperatives/${inviteCode}/invite`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCircleMembers(circleId: string): Promise<CircleMember[]> {
    const response = await axios.get<CircleMember[]>(
      `${V1}/${circleId}/members`,
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  async getCircleHistory(circleId: string): Promise<CircleHistoryEntry[]> {
    const response = await axios.get<CircleHistoryEntry[]>(
      `${V1}/${circleId}/history`,
      { headers: AuthService.getAuthHeader() }
    );
    return response.data;
  },

  async getMyCircles(): Promise<Circle[]> {
    const response = await axios.get<Circle[]>(`${V1}`, {
      headers: AuthService.getAuthHeader(),
    });
    return response.data;
  },

  async waitForTx(txId: string | null | undefined): Promise<void> {
    if (!txId) return;
    await fcl.tx(txId).onceSealed();
  },
};

export default CircleService;
