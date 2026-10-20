"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import RulesService from "@/services/rules-service";
import type { DecisionModel, RuleAmendmentApprovalType } from "@/types/cooperative";
import {
  WizardActions,
  WizardButton,
  WizardField,
  WizardStepHeader,
  fieldClassName,
} from "@/components/cooperative/create/wizard-ui";

const DECISION_MODELS: { value: DecisionModel; label: string }[] = [
  { value: "admin_led", label: "Admin decides" },
  { value: "majority_vote", label: "Majority vote" },
  { value: "weighted_vote", label: "Weighted vote (by contribution)" },
  { value: "consensus", label: "Consensus" },
];

const AMENDMENT_APPROVAL_TYPES: { value: RuleAmendmentApprovalType; label: string }[] = [
  { value: "admin_only", label: "Admin only" },
  { value: "majority_vote", label: "Majority Vote" },
  { value: "unanimous", label: "Unanimous" },
];

interface GovernanceRuleFormProps {
  onContinue: () => void;
  onBack: () => void;
}

export function GovernanceRuleForm({ onContinue, onBack }: GovernanceRuleFormProps) {
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const draft = useCooperativeCreationStore((s) => s.governanceDraft);
  const updateDraft = useCooperativeCreationStore((s) => s.updateGovernanceDraft);
  const markRuleSaved = useCooperativeCreationStore((s) => s.markRuleSaved);

  const [loadingActive, setLoadingActive] = useState(true);
  const [hasActive, setHasActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the current active version when re-entering this step —
  // there's no PATCH, so "editing" means starting a new version from here.
  useEffect(() => {
    if (!cooperativeId) return;
    let cancelled = false;
    setLoadingActive(true);
    RulesService.getActiveGovernanceRule(cooperativeId)
      .then((rule) => {
        if (cancelled) return;
        setHasActive(true);
        updateDraft({
          decision_model: rule.decision_model,
          quorum_pct: rule.quorum_pct,
          voting_threshold_pct: rule.voting_threshold_pct,
          members_can_propose_changes: rule.members_can_propose_changes,
          rule_amendment_approval_type: rule.rule_amendment_approval_type,
        });
      })
      .catch(() => {
        // 404 == not configured yet, not an error worth surfacing
        if (!cancelled) setHasActive(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingActive(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooperativeId]);

  const canSubmit =
    !!draft.decision_model &&
    draft.quorum_pct != null &&
    draft.voting_threshold_pct != null &&
    draft.members_can_propose_changes != null &&
    !!draft.rule_amendment_approval_type;

  async function handleSubmit() {
    if (!cooperativeId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await RulesService.createGovernanceRule(cooperativeId, {
        decision_model: draft.decision_model!,
        quorum_pct: draft.quorum_pct!,
        voting_threshold_pct: draft.voting_threshold_pct!,
        members_can_propose_changes: draft.members_can_propose_changes!,
        rule_amendment_approval_type: draft.rule_amendment_approval_type!,
      });
      markRuleSaved("governance");
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save governance rule");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cooperativeId) {
    return (
      <div className="rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] p-4 text-sm text-[#6B4E12] dark:border-[#5A4A22] dark:bg-[#2E2818] dark:text-[#E8BC63]">
        Create the cooperative in Step 2 first.
      </div>
    );
  }

  if (loadingActive) {
    return (
      <div className="space-y-6">
        <WizardStepHeader
          eyebrow="Step 3 · Governance"
          title="Governance rule"
          description="How decisions get made in this cooperative."
        />
        <div className="space-y-4">
          <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
            <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
          </div>
          <div className="h-[74px] animate-pulse rounded-2xl bg-content/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        eyebrow="Step 3 · Governance"
        title="Governance rule"
        description={
          hasActive
            ? "This saves a new version — history is kept, nothing is overwritten."
            : "How decisions get made in this cooperative."
        }
      />

      <div className="space-y-4">
        <WizardField label="Decision model">
          <Select
            value={draft.decision_model}
            onValueChange={(v) => updateDraft({ decision_model: v as DecisionModel })}
          >
            <SelectTrigger className={`${fieldClassName} flex items-center justify-between`}>
              <SelectValue placeholder="Select a decision model" />
            </SelectTrigger>
            <SelectContent>
              {DECISION_MODELS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </WizardField>

        <div className="grid grid-cols-2 gap-4">
          <WizardField label="Quorum %" htmlFor="quorum-pct">
            <Input
              id="quorum-pct"
              type="number"
              min={0}
              max={100}
              value={draft.quorum_pct ?? ""}
              onChange={(e) => updateDraft({ quorum_pct: Number(e.target.value) })}
              className={fieldClassName}
            />
          </WizardField>
          <WizardField label="Voting threshold %" htmlFor="voting-threshold-pct">
            <Input
              id="voting-threshold-pct"
              type="number"
              min={0}
              max={100}
              value={draft.voting_threshold_pct ?? ""}
              onChange={(e) => updateDraft({ voting_threshold_pct: Number(e.target.value) })}
              className={fieldClassName}
            />
          </WizardField>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-content/10 bg-content/[0.02] p-4">
          <div className="min-w-0">
            <Label
              htmlFor="members-can-propose"
              className="text-sm font-medium text-content/80"
            >
              Members can propose rule changes
            </Label>
            <p className="mt-0.5 text-[11px] leading-snug text-content/40">
              Anyone in the cooperative can open an amendment.
            </p>
          </div>
          <Switch
            id="members-can-propose"
            checked={!!draft.members_can_propose_changes}
            onCheckedChange={(checked) => updateDraft({ members_can_propose_changes: checked })}
          />
        </div>

        <WizardField label="Rule amendment approval">
          <Select
            value={draft.rule_amendment_approval_type}
            onValueChange={(v) =>
              updateDraft({ rule_amendment_approval_type: v as RuleAmendmentApprovalType })
            }
          >
            <SelectTrigger className={`${fieldClassName} flex items-center justify-between`}>
              <SelectValue placeholder="How are amendments approved?" />
            </SelectTrigger>
            <SelectContent>
              {AMENDMENT_APPROVAL_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </WizardField>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <WizardActions>
        <WizardButton variant="ghost" onClick={onBack}>
          Back
        </WizardButton>
        <WizardButton disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Saving…" : hasActive ? "Save new version" : "Save and continue"}
        </WizardButton>
      </WizardActions>
    </div>
  );
}
