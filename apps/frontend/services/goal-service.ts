import ApiService from "@/services/api-service";
import type {
  Goal,
  CreateGoalPayload,
  GoalContract,
  CreateGoalContractPayload,
  OwnershipShare,
  CreateOwnershipSharePayload,
  BeneficiaryPattern,
  GoalCategory,
} from "@/types/cooperative";


const GoalService = {
  async getBeneficiaryPatterns() {
    return ApiService.get<BeneficiaryPattern[]>("/cooperatives/catalog/beneficiary-patterns");
  },
  async getGoalCategories() {
    return ApiService.get<GoalCategory[]>("/cooperatives/catalog/goal-categories");
  },
  async createGoal(cooperativeId: string, payload: CreateGoalPayload) {
    return ApiService.post<Goal>(`/cooperatives/${cooperativeId}/goals`, payload);
  },
  async listGoals(cooperativeId: string) {
    return ApiService.get<Goal[]>(`/cooperatives/${cooperativeId}/goals`);
  },
  async getGoal(goalId: string) {
    return ApiService.get<Goal>(`/cooperatives/goals/${goalId}`);
  },
  async createGoalContract(goalId: string, payload: CreateGoalContractPayload) {
    return ApiService.post<GoalContract>(`/cooperatives/goals/${goalId}/contract`, payload);
  },
  async createOwnershipShare(goalId: string, payload: CreateOwnershipSharePayload) {
    return ApiService.post<OwnershipShare>(`/cooperatives/goals/${goalId}/ownership-shares`, payload);
  },
  async getOwnershipShares(goalId: string) {
    return ApiService.get<OwnershipShare[]>(`/cooperatives/goals/${goalId}/ownership-shares`);
  },
};

export default GoalService;