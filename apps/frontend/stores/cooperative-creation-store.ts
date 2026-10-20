import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CoopModel,
  CreateCooperativePayload,
  CreateGovernanceRulePayload,
  CreateMembershipRulePayload,
  CreateFinancialRulePayload,
  CreateDecisionRulePayload,
  DecisionMechanism,
  DecisionType,
  RequiredRuleType,
} from "@/types/cooperative";

/**
 * Owns in-progress wizard state only (Steps 0-6: cooperative basics +
 * governance/membership/financial/decision rules + activation). Everything
 * that is server state (the cooperative itself once created, rules once
 * saved) should be re-fetched with React Query, not read back out of here —
 * this store is the scratchpad for the *form*, not a cache of the API.
 *
 * Persisted to sessionStorage (not localStorage): this is an abandon/resume
 * draft for a single browser session, not a durable preference. Cleared on
 * successful activation or explicit discard.
 */

export type WizardStepId =
  | "type"
  | "basics"
  | "governance"
  | "membership"
  | "financial"
  | "decision"
  | "review";

const STEP_ORDER: WizardStepId[] = [
  "type",
  "basics",
  "governance",
  "membership",
  "financial",
  "decision",
  "review",
];

interface DecisionRuleDraft {
  decision_type: DecisionType;
  enabled: boolean;
  values: Partial<CreateDecisionRulePayload>;
}

const DECISION_TYPES: DecisionType[] = [
  "payout_order",
  "dispute_resolution",
  "exit_valuation",
  "rule_amendment",
  "new_member_approval",
];

interface ModelDefaults {
  governance: Partial<CreateGovernanceRulePayload>;
  membership: Partial<CreateMembershipRulePayload>;
  financial: Partial<CreateFinancialRulePayload>;
  decisions: Partial<Record<DecisionType, DecisionMechanism>>;
}

/**
 * Pre-fills for every rule step, keyed by the model picked in Step 1. These
 * are starting points only — whatever the member has already typed always
 * wins when the model is selected (or re-selected).
 */
const MODEL_DEFAULTS: Record<CoopModel, ModelDefaults> = {
  ajo: {
    governance: {
      decision_model: "admin_led",
      quorum_pct: 50,
      voting_threshold_pct: 50,
      members_can_propose_changes: true,
      rule_amendment_approval_type: "admin_only",
    },
    membership: {
      join_type: "invite_only",
      min_members: 5,
      max_members: 20,
      public_discovery: false,
      kyc_level_required: "basic",
      exit_notice_days: 30,
      removal_policy: "vote",
    },
    financial: {
      contribution_frequency: "weekly",
      currency: "NGN",
      grace_period_days: 2,
      penalty_type: "flat",
      penalty_value: 500,
      payout_strategy: "rotating",
      rotation_order: "sequential",
    },
    decisions: {
      payout_order: "rotation",
      dispute_resolution: "admin",
    },
  },
  esusu: {
    governance: {
      decision_model: "admin_led",
      quorum_pct: 50,
      voting_threshold_pct: 50,
      members_can_propose_changes: true,
      rule_amendment_approval_type: "admin_only",
    },
    membership: {
      join_type: "invite_only",
      min_members: 5,
      max_members: 20,
      public_discovery: false,
      kyc_level_required: "basic",
      exit_notice_days: 30,
      removal_policy: "vote",
    },
    financial: {
      contribution_frequency: "weekly",
      currency: "NGN",
      grace_period_days: 2,
      penalty_type: "flat",
      penalty_value: 500,
      payout_strategy: "rotating",
      rotation_order: "sequential",
    },
    decisions: {
      payout_order: "rotation",
      dispute_resolution: "admin",
    },
  },
  adashe: {
    governance: {
      decision_model: "admin_led",
      quorum_pct: 50,
      voting_threshold_pct: 50,
      members_can_propose_changes: true,
      rule_amendment_approval_type: "admin_only",
    },
    membership: {
      join_type: "invite_only",
      min_members: 5,
      max_members: 30,
      public_discovery: false,
      kyc_level_required: "basic",
      exit_notice_days: 30,
      removal_policy: "vote",
    },
    financial: {
      contribution_frequency: "monthly",
      currency: "NGN",
      grace_period_days: 3,
      penalty_type: "flat",
      penalty_value: 500,
      payout_strategy: "rotating",
      rotation_order: "sequential",
    },
    decisions: {
      payout_order: "rotation",
      dispute_resolution: "admin",
    },
  },
  chama: {
    governance: {
      decision_model: "majority_vote",
      quorum_pct: 50,
      voting_threshold_pct: 50,
      members_can_propose_changes: true,
      rule_amendment_approval_type: "majority_vote",
    },
    membership: {
      join_type: "application_required",
      min_members: 5,
      max_members: null,
      public_discovery: false,
      kyc_level_required: "basic",
      exit_notice_days: 30,
      removal_policy: "vote",
    },
    financial: {
      contribution_frequency: "monthly",
      currency: "NGN",
      grace_period_days: 3,
      penalty_type: "none",
      penalty_value: null,
      payout_strategy: "equal",
    },
    decisions: {
      payout_order: "vote",
      new_member_approval: "vote",
    },
  },
  coop: {
    governance: {
      decision_model: "majority_vote",
      quorum_pct: 50,
      voting_threshold_pct: 50,
      members_can_propose_changes: true,
      rule_amendment_approval_type: "majority_vote",
    },
    membership: {
      join_type: "application_required",
      min_members: 3,
      max_members: null,
      public_discovery: true,
      kyc_level_required: "basic",
      exit_notice_days: 30,
      removal_policy: "vote",
    },
    financial: {
      contribution_frequency: "monthly",
      currency: "NGN",
      grace_period_days: 3,
      penalty_type: "none",
      penalty_value: null,
      payout_strategy: "rotating",
      rotation_order: "sequential",
    },
    decisions: {
      new_member_approval: "admin",
    },
  },
};

interface CooperativeCreationState {
  // Identity — set once Step 1's POST succeeds; every later step keys off this.
  cooperativeId: string | null;

  // Step 0: cosmetic type selection, seeds defaults for later steps.
  coopModel: CoopModel | null;

  // Step 1
  basicsDraft: Partial<CreateCooperativePayload>;

  // Steps 2-4: which required rules have a saved active version.
  completedRules: Record<RequiredRuleType, boolean>;
  governanceDraft: Partial<CreateGovernanceRulePayload>;
  membershipDraft: Partial<CreateMembershipRulePayload>;
  financialDraft: Partial<CreateFinancialRulePayload>;

  // Step 5: keyed by decision_type, all optional.
  decisionDrafts: Record<DecisionType, DecisionRuleDraft>;

  // Step 6: last error surfaced by activate(), for the missing-fields banner.
  activationMissing: RequiredRuleType[] | null;

  currentStep: WizardStepId;

  // --- actions -------------------------------------------------------
  setCoopModel: (model: CoopModel) => void;
  setCooperativeId: (id: string) => void;
  updateBasicsDraft: (patch: Partial<CreateCooperativePayload>) => void;
  markRuleSaved: (type: RequiredRuleType) => void;
  updateGovernanceDraft: (patch: Partial<CreateGovernanceRulePayload>) => void;
  updateMembershipDraft: (patch: Partial<CreateMembershipRulePayload>) => void;
  updateFinancialDraft: (patch: Partial<CreateFinancialRulePayload>) => void;
  toggleDecisionType: (type: DecisionType, enabled: boolean) => void;
  updateDecisionDraft: (type: DecisionType, patch: Partial<CreateDecisionRulePayload>) => void;
  setActivationMissing: (missing: RequiredRuleType[] | null) => void;
  goToStep: (step: WizardStepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  /** Which of the 3 required rules are still missing, computed client-side
   *  so Step 6 can disable the activate button without round-tripping. */
  missingRequiredRules: () => RequiredRuleType[];
  reset: () => void;
}

function emptyDecisionDrafts(): Record<DecisionType, DecisionRuleDraft> {
  return DECISION_TYPES.reduce((acc, type) => {
    acc[type] = { decision_type: type, enabled: false, values: {} };
    return acc;
  }, {} as Record<DecisionType, DecisionRuleDraft>);
}

const initialState = {
  cooperativeId: null as string | null,
  coopModel: null as CoopModel | null,
  basicsDraft: {} as Partial<CreateCooperativePayload>,
  completedRules: { governance: false, membership: false, financial: false },
  governanceDraft: {} as Partial<CreateGovernanceRulePayload>,
  membershipDraft: {} as Partial<CreateMembershipRulePayload>,
  financialDraft: {} as Partial<CreateFinancialRulePayload>,
  decisionDrafts: emptyDecisionDrafts(),
  activationMissing: null as RequiredRuleType[] | null,
  currentStep: "type" as WizardStepId,
};

export const useCooperativeCreationStore = create<CooperativeCreationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCoopModel: (model) =>
        set((s) => {
          const defaults = MODEL_DEFAULTS[model];

          // Seed the optional decision rules that suit this model. Anything
          // already enabled (or chosen) stays as the member left it.
          const decisionDrafts = { ...s.decisionDrafts };
          (
            Object.entries(defaults.decisions) as [DecisionType, DecisionMechanism][]
          ).forEach(([type, mechanism]) => {
            const existing = decisionDrafts[type];
            decisionDrafts[type] = {
              ...existing,
              enabled: true,
              values: {
                ...existing.values,
                mechanism: existing.values.mechanism ?? mechanism,
              },
            };
          });

          return {
            coopModel: model,
            basicsDraft: { ...s.basicsDraft, coop_model: model },
            governanceDraft: { ...defaults.governance, ...s.governanceDraft },
            membershipDraft: { ...defaults.membership, ...s.membershipDraft },
            financialDraft: { ...defaults.financial, ...s.financialDraft },
            decisionDrafts,
          };
        }),

      setCooperativeId: (id) => set({ cooperativeId: id }),

      updateBasicsDraft: (patch) =>
        set((s) => ({ basicsDraft: { ...s.basicsDraft, ...patch } })),

      markRuleSaved: (type) =>
        set((s) => ({
          completedRules: { ...s.completedRules, [type]: true },
        })),

      updateGovernanceDraft: (patch) =>
        set((s) => ({ governanceDraft: { ...s.governanceDraft, ...patch } })),

      updateMembershipDraft: (patch) =>
        set((s) => ({ membershipDraft: { ...s.membershipDraft, ...patch } })),

      updateFinancialDraft: (patch) =>
        set((s) => ({ financialDraft: { ...s.financialDraft, ...patch } })),

      toggleDecisionType: (type, enabled) =>
        set((s) => ({
          decisionDrafts: {
            ...s.decisionDrafts,
            [type]: { ...s.decisionDrafts[type], enabled },
          },
        })),

      updateDecisionDraft: (type, patch) =>
        set((s) => ({
          decisionDrafts: {
            ...s.decisionDrafts,
            [type]: {
              ...s.decisionDrafts[type],
              values: { ...s.decisionDrafts[type].values, ...patch },
            },
          },
        })),

      setActivationMissing: (missing) => set({ activationMissing: missing }),

      goToStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((s) => {
          const idx = STEP_ORDER.indexOf(s.currentStep);
          const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
          return { currentStep: next };
        }),

      prevStep: () =>
        set((s) => {
          const idx = STEP_ORDER.indexOf(s.currentStep);
          const prev = STEP_ORDER[Math.max(idx - 1, 0)];
          return { currentStep: prev };
        }),

      missingRequiredRules: () => {
        const { completedRules } = get();
        return (Object.keys(completedRules) as RequiredRuleType[]).filter(
          (k) => !completedRules[k]
        );
      },

      reset: () => set({ ...initialState, decisionDrafts: emptyDecisionDrafts() }),
    }),
    {
      name: "coopwise-cooperative-creation-draft",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);