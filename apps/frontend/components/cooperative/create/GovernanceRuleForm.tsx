"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

// UNCONFIRMED enum values (types/cooperative.ts) — swap once schema confirmed.
const DECISION_MODELS: { value: DecisionModel; label: string }[] = [
  { value: "admin_decides", label: "Admin decides" },
  { value: "majority_vote", label: "Majority vote" },
  { value: "supermajority_vote", label: "Supermajority vote" },
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
      <p className="text-sm text-muted-foreground">
        Create the cooperative in Step 1 first.
      </p>
    );
  }

  if (loadingActive) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Governance rule</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hasActive
            ? "This saves a new version — history is kept, nothing is overwritten."
            : "How decisions get made in this cooperative."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Decision model</Label>
          <Select
            value={draft.decision_model}
            onValueChange={(v) => updateDraft({ decision_model: v as DecisionModel })}
          >
            <SelectTrigger>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quorum-pct">Quorum %</Label>
            <Input
              id="quorum-pct"
              type="number"
              min={0}
              max={100}
              value={draft.quorum_pct ?? ""}
              onChange={(e) => updateDraft({ quorum_pct: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voting-threshold-pct">Voting threshold %</Label>
            <Input
              id="voting-threshold-pct"
              type="number"
              min={0}
              max={100}
              value={draft.voting_threshold_pct ?? ""}
              onChange={(e) => updateDraft({ voting_threshold_pct: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label htmlFor="members-can-propose">Members can propose rule changes</Label>
          </div>
          <Switch
            id="members-can-propose"
            checked={!!draft.members_can_propose_changes}
            onCheckedChange={(checked) => updateDraft({ members_can_propose_changes: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Rule amendment approval</Label>
          <Select
            value={draft.rule_amendment_approval_type}
            onValueChange={(v) =>
              updateDraft({ rule_amendment_approval_type: v as RuleAmendmentApprovalType })
            }
          >
            <SelectTrigger>
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
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Saving…" : hasActive ? "Save new version" : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}