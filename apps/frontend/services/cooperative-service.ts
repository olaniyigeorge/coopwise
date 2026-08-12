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

  async listMyCooperatives() {
    return ApiService.get<Cooperative[]>(`${BASE}/me`);
  },

  async activateCooperative(id: string) {
    return ApiService.post<Cooperative>(`${BASE}/${id}/activate`);
  },

  async getCooperativeMembers(id: string) {
    return ApiService.get<CooperativeMember[]>(`${BASE}/${id}/members`);
  },
};

export default CooperativeService;