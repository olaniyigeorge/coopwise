import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BeneficiaryPatternCode,
  CreateGoalPayload,
  CreateGoalContractPayload,
  CreateOwnershipSharePayload,
} from "@/types/cooperative";

/**
 * Separate from cooperative-creation-store on purpose: a cooperative is
 * created once, but goals are created many times over its life. This store
 * is keyed by cooperativeId so re-entering the flow for a different
 * cooperative doesn't collide with an abandoned draft for another one.
 */

export type GoalWizardStepId = "basics" | "contract" | "ownership" | "review";

interface OwnershipShareDraft extends Partial<CreateOwnershipSharePayload> {
  _rowId: string; // client-only key for list rendering, not sent to API
}

interface GoalCreationState {
  cooperativeId: string | null;
  goalId: string | null;

  basicsDraft: Partial<CreateGoalPayload>;
  selectedPatternCode: BeneficiaryPatternCode | null;

  contractDraft: CreateGoalContractPayload;
  contractMissing: string[] | null; // from IncompleteGoalContractError, for the banner

  ownershipShares: OwnershipShareDraft[];

  currentStep: GoalWizardStepId;

  startForCooperative: (cooperativeId: string) => void;
  setGoalId: (id: string) => void;
  updateBasicsDraft: (patch: Partial<CreateGoalPayload>) => void;
  selectPattern: (code: BeneficiaryPatternCode, patternId: string) => void;
  updateContractDraft: (patch: CreateGoalContractPayload) => void;
  setContractMissing: (missing: string[] | null) => void;
  addOwnershipRow: () => void;
  updateOwnershipRow: (rowId: string, patch: Partial<CreateOwnershipSharePayload>) => void;
  removeOwnershipRow: (rowId: string) => void;
  clearOwnershipRows: () => void;
  ownershipTotalPct: () => number;
  goToStep: (step: GoalWizardStepId) => void;
  reset: () => void;
}

const initialState = {
  cooperativeId: null as string | null,
  goalId: null as string | null,
  basicsDraft: {} as Partial<CreateGoalPayload>,
  selectedPatternCode: null as BeneficiaryPatternCode | null,
  contractDraft: {} as CreateGoalContractPayload,
  contractMissing: null as string[] | null,
  ownershipShares: [] as OwnershipShareDraft[],
  currentStep: "basics" as GoalWizardStepId,
};

export const useGoalCreationStore = create<GoalCreationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startForCooperative: (cooperativeId) =>
        set((s) =>
          // If switching to a different cooperative than the in-flight draft,
          // start fresh rather than leaking another coop's goal draft in.
          s.cooperativeId === cooperativeId
            ? s
            : { ...initialState, cooperativeId }
        ),

      setGoalId: (id) => set({ goalId: id }),

      updateBasicsDraft: (patch) =>
        set((s) => ({ basicsDraft: { ...s.basicsDraft, ...patch } })),

      selectPattern: (code, patternId) =>
        set((s) => ({
          selectedPatternCode: code,
          basicsDraft: { ...s.basicsDraft, beneficiary_pattern_id: patternId },
          // Changing pattern invalidates whatever contract fields were drafted
          // for the previous pattern.
          contractDraft: {},
          ownershipShares: [],
        })),

      updateContractDraft: (patch) =>
        set((s) => ({ contractDraft: { ...s.contractDraft, ...patch } })),

      setContractMissing: (missing) => set({ contractMissing: missing }),

      addOwnershipRow: () =>
        set((s) => ({
          ownershipShares: [
            ...s.ownershipShares,
            { _rowId: crypto.randomUUID(), basis: "contribution_based" as const },
          ],
        })),

      updateOwnershipRow: (rowId, patch) =>
        set((s) => ({
          ownershipShares: s.ownershipShares.map((row) =>
            row._rowId === rowId ? { ...row, ...patch } : row
          ),
        })),

      removeOwnershipRow: (rowId) =>
        set((s) => ({
          ownershipShares: s.ownershipShares.filter((row) => row._rowId !== rowId),
        })),

      clearOwnershipRows: () => set({ ownershipShares: [] }),

      ownershipTotalPct: () =>
        get().ownershipShares.reduce((sum, row) => sum + (row.share_pct ?? 0), 0),

      goToStep: (step) => set({ currentStep: step }),

      reset: () => set(initialState),
    }),
    {
      name: "coopwise-goal-creation-draft",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);