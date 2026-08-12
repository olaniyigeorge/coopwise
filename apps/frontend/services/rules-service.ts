import ApiService from "@/services/api-service";
import type {
  RequiredRuleType,
  DecisionType,
  GovernanceRule,
  MembershipRule,
  FinancialRule,
  DecisionRule,
  CreateGovernanceRulePayload,
  CreateMembershipRulePayload,
  CreateFinancialRulePayload,
  CreateDecisionRulePayload,
} from "@/types/cooperative";

/**
 * Rules are append-only (VersionedMixin) — there is no PATCH. "Editing" a
 * rule is: prefill a form with getActive*(), submit calls create*() again,
 * which the backend records as version N+1 and closes the previous row's
 * effective_to. Every create* call below should surface a "Save new
 * version" label in the UI, not "Save" (design doc §1).
 */

const base = (cooperativeId: string) => `/cooperatives/${cooperativeId}/rules`;

const RulesService = {
  // --- Governance ---------------------------------------------------
  async createGovernanceRule(cooperativeId: string, payload: CreateGovernanceRulePayload) {
    return ApiService.post<GovernanceRule>(`${base(cooperativeId)}/governance`, payload);
  },
  async getActiveGovernanceRule(cooperativeId: string) {
    // Returns null-shaped 404 when no version exists yet — callers should
    // treat a 404 here as "not yet configured," not an error toast.
    return ApiService.get<GovernanceRule>(`${base(cooperativeId)}/governance/active`);
  },

  // --- Membership -----------------------------------------------------
  async createMembershipRule(cooperativeId: string, payload: CreateMembershipRulePayload) {
    return ApiService.post<MembershipRule>(`${base(cooperativeId)}/membership`, payload);
  },
  async getActiveMembershipRule(cooperativeId: string) {
    return ApiService.get<MembershipRule>(`${base(cooperativeId)}/membership/active`);
  },

  // --- Financial --------------------------------------------------------
  async createFinancialRule(cooperativeId: string, payload: CreateFinancialRulePayload) {
    return ApiService.post<FinancialRule>(`${base(cooperativeId)}/financial`, payload);
  },
  async getActiveFinancialRule(cooperativeId: string) {
    return ApiService.get<FinancialRule>(`${base(cooperativeId)}/financial/active`);
  },

  // --- Decision (optional, keyed by decision_type) -----------------------
  // UNCONFIRMED shape: design doc only shows "POST {id}/rules/decision ×N",
  // it's ambiguous whether decision_type is a path segment or a body field.
  // Assuming body field here since there's a single POST path listed, not
  // one per decision_type. Swap to a path segment if Swagger disagrees.
  async createDecisionRule(cooperativeId: string, payload: CreateDecisionRulePayload) {
    return ApiService.post<DecisionRule>(`${base(cooperativeId)}/decision`, payload);
  },
  async getActiveDecisionRule(cooperativeId: string, decisionType: DecisionType) {
    return ApiService.get<DecisionRule>(
      `${base(cooperativeId)}/decision/active?decision_type=${decisionType}`
    );
  },

  // --- Convenience: fetch all three required rules' active versions ----
  // Used by Step 6 (Review) to render the "already configured" summary and
  // by the resumable setup entry point (cooperative/[id]/setup).
  async getActiveRequiredRules(cooperativeId: string) {
    const results = await Promise.allSettled([
      RulesService.getActiveGovernanceRule(cooperativeId),
      RulesService.getActiveMembershipRule(cooperativeId),
      RulesService.getActiveFinancialRule(cooperativeId),
    ]);

    const [governance, membership, financial] = results.map((r) =>
      r.status === "fulfilled" ? r.value : null
    );

    const missing: RequiredRuleType[] = [];
    if (!governance) missing.push("governance");
    if (!membership) missing.push("membership");
    if (!financial) missing.push("financial");

    return { governance, membership, financial, missing };
  },
};

export default RulesService;