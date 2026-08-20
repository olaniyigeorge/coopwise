"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import RulesService from "@/services/rules-service";
import type {
  ContributionFrequency,
  PenaltyType,
  PayoutStrategy,
  RotationOrder,
} from "@/types/cooperative";

// UNCONFIRMED enum values — swap once schema confirmed.
const FREQUENCIES: { value: ContributionFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

const PENALTY_TYPES: { value: PenaltyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "flat", label: "Flat amount" },
  { value: "percentage", label: "Percentage" },
];

const PAYOUT_STRATEGIES: { value: PayoutStrategy; label: string }[] = [
  { value: "rotating", label: "Rotating — one member per cycle" },
  { value: "equal", label: "Equal — share in goal" },
  { value: "priority", label: "Priority — on-demand request" },
];

const ROTATION_ORDER: { value: RotationOrder; label: string }[] = [
  { value: "sequential", label: "Sequential" },
  { value: "random", label: "Random" },
];

interface FinancialRuleFormProps {
  onContinue: () => void;
  onBack: () => void;
}

export function FinancialRuleForm({ onContinue, onBack }: FinancialRuleFormProps) {
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const draft = useCooperativeCreationStore((s) => s.financialDraft);
  const updateDraft = useCooperativeCreationStore((s) => s.updateFinancialDraft);
  const markRuleSaved = useCooperativeCreationStore((s) => s.markRuleSaved);

  const [loadingActive, setLoadingActive] = useState(true);
  const [hasActive, setHasActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cooperativeId) return;
    let cancelled = false;
    setLoadingActive(true);
    RulesService.getActiveFinancialRule(cooperativeId)
      .then((rule) => {
        if (cancelled) return;
        setHasActive(true);
        updateDraft({
          contribution_frequency: rule.contribution_frequency,
          contribution_amount: rule.contribution_amount,
          currency: rule.currency,
          grace_period_days: rule.grace_period_days,
          penalty_type: rule.penalty_type,
          penalty_value: rule.penalty_value,
          payout_strategy: rule.payout_strategy,
          rotation_order: rule.rotation_order,
        });
      })
      .catch(() => {
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

  const needsPenaltyValue = draft.penalty_type && draft.penalty_type !== "none";
  const needsRotationOrder = draft.payout_strategy === "rotating";

  const canSubmit =
    !!draft.contribution_frequency &&
    draft.contribution_amount != null &&
    !!draft.currency?.trim() &&
    draft.grace_period_days != null &&
    !!draft.penalty_type &&
    (!needsPenaltyValue || draft.penalty_value != null) &&
    !!draft.payout_strategy &&
    (!needsRotationOrder || draft.rotation_order);

  async function handleSubmit() {
    if (!cooperativeId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await RulesService.createFinancialRule(cooperativeId, {
        contribution_frequency: draft.contribution_frequency!,
        contribution_amount: draft.contribution_amount!,
        currency: draft.currency!.trim(),
        grace_period_days: draft.grace_period_days!,
        penalty_type: draft.penalty_type!,
        penalty_value: needsPenaltyValue ? draft.penalty_value ?? null : null,
        payout_strategy: draft.payout_strategy!,
        rotation_order: draft.rotation_order!,
      });
      markRuleSaved("financial");
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save financial rule");
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
        <h2 className="text-xl font-semibold">Financial rule</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hasActive
            ? "This saves a new version — history is kept, nothing is overwritten."
            : "How much, how often, and what happens on payout or missed contribution."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Contribution frequency</Label>
            <Select
              value={draft.contribution_frequency}
              onValueChange={(v) =>
                updateDraft({ contribution_frequency: v as ContributionFrequency })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contribution-amount">Contribution amount</Label>
            <Input
              id="contribution-amount"
              type="number"
              min={0}
              value={draft.contribution_amount ?? ""}
              onChange={(e) => updateDraft({ contribution_amount: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={draft.currency ?? ""}
              onChange={(e) => updateDraft({ currency: e.target.value.toUpperCase() })}
              placeholder="NGN"
              maxLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grace-period-days">Grace period (days)</Label>
            <Input
              id="grace-period-days"
              type="number"
              min={0}
              value={draft.grace_period_days ?? ""}
              onChange={(e) => updateDraft({ grace_period_days: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Penalty type</Label>
            <Select
              value={draft.penalty_type}
              onValueChange={(v) => updateDraft({ penalty_type: v as PenaltyType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select penalty type" />
              </SelectTrigger>
              <SelectContent>
                {PENALTY_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {needsPenaltyValue && (
            <div className="space-y-2">
              <Label htmlFor="penalty-value">
                Penalty value {draft.penalty_type === "percentage" ? "(%)" : ""}
              </Label>
              <Input
                id="penalty-value"
                type="number"
                min={0}
                value={draft.penalty_value ?? ""}
                onChange={(e) => updateDraft({ penalty_value: Number(e.target.value) })}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Payout strategy</Label>
          <Select
            value={draft.payout_strategy}
            onValueChange={(v) => updateDraft({ payout_strategy: v as PayoutStrategy })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payout strategy" />
            </SelectTrigger>
            <SelectContent>
              {PAYOUT_STRATEGIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsRotationOrder && (
          <div className="space-y-2">
            <Label>Rotation Order </Label>
            <Select
              value={draft.rotation_order}
              onValueChange={(v) => updateDraft({ rotation_order: v as RotationOrder })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rotation order" />
              </SelectTrigger>
              <SelectContent>
                {ROTATION_ORDER.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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