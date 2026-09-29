import ApiService from "@/services/api-service";
import type {
  Cooperative,
  CreateCooperativePayload,
  CooperativeMember,
  CooperativePreview,
  ActivityDetail,
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

  async getCooperativeActivities(id: string) {
    return ApiService.get<ActivityDetail[]>(`${BASE}/${id}/activities`);
  },

  // Generates an invite code for this cooperative (memberships domain).
  async generateInviteCode(cooperativeId: string) {
    return ApiService.get<{ message: string; invite_code: string }>(
      `${BASE}/${cooperativeId}/invite`
    );
  },

  // What someone deciding whether to join is allowed to see.
  async getCooperativePreview(id: string) {
    return ApiService.get<CooperativePreview>(`${BASE}/${id}/preview`);
  },

  // "Checks out" an invite code — previews/registers a click against it.
  async verifyInviteCode(inviteCode: string) {
    return ApiService.get<Record<string, unknown>>(
      `${BASE}/invite?invite_code=${encodeURIComponent(inviteCode)}`
    );
  },

  // Accepts an invite code, turning the click into an active membership.
  // Matches the real GroupMembership row (memberships/schemas.py's
  // MembershipDetails) — id is a UUID, not int/number.
  async acceptInviteCode(inviteCode: string) {
    return ApiService.post<{
      id: string;
      user_id: string;
      group_id: string;
      role: string;
      status: string;
    }>(`${BASE}/accept-invite`, { invite_code: inviteCode });
  },
};

export default CooperativeService;