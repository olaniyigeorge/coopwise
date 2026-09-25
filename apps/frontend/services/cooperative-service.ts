import ApiService from "@/services/api-service";
import type {
  Cooperative,
  CreateCooperativePayload,
  CooperativeMember,
} from "@/types/cooperative";



const BASE = "/cooperatives";


const CooperativeService = {
  async createCooperative(payload: CreateCooperativePayload) {
    return ApiService.post<Cooperative>(BASE, payload);
  },

  async getCooperative(id: string) {
    return ApiService.get<Cooperative>(`${BASE}/${id}`);
  },

  // All cooperatives (discovery). Cards render only fields CooperativeRead
  // actually has — contribution/target/member-count aren't on this payload.
  async listCooperatives() {
    return ApiService.get<Cooperative[]>(BASE);
  },

  async listMyCooperatives() {
    return ApiService.get<Cooperative[]>(`${BASE}/me`);
  },

  async activateCooperative(id: string) {
    return ApiService.post<Cooperative>(`${BASE}/${id}/activate`);
  },

  async getCooperativeMembers(id: string) {
    return ApiService.get<CooperativeMember[]>(`${BASE}/${id}/members`);
  },

  // Generates an invite code for this cooperative (memberships domain).
  async generateInviteCode(cooperativeId: string) {
    return ApiService.get<{ message: string; invite_code: string }>(
      `${BASE}/${cooperativeId}/invite`
    );
  },

  // "Checks out" an invite code — previews/registers a click against it.
  async verifyInviteCode(inviteCode: string) {
    return ApiService.get<Record<string, unknown>>(
      `${BASE}/invite?invite_code=${encodeURIComponent(inviteCode)}`
    );
  },

  // Accepts an invite code, turning the click into an active membership.
  async acceptInviteCode(inviteCode: string) {
    return ApiService.post<{
      id: number;
      user_id: string;
      group_id: string;
      role: string;
      status: string;
    }>(`${BASE}/accept-invite`, { invite_code: inviteCode });
  },
};

export default CooperativeService;