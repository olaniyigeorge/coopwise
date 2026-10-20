"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
import {
  WizardActions,
  WizardButton,
  WizardField,
  WizardStepHeader,
  fieldClassName,
} from "@/components/cooperative/create/wizard-ui";

const FREQUENCIES: { value: ContributionFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom schedule" },
];

const PENALTY_TYPES: { value: PenaltyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "flat", label: "Flat amount" },
  { value: "pct", label: "Percentage" },
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
      <div className="rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] p-4 text-sm text-[#6B4E12] dark:border-[#5A4A22] dark:bg-[#2E2818] dark:text-[#E8BC63]">
        Create the cooperative in Step 2 first.
      </div>
    );
  }

  if (loadingActive) {
    return (
      <div className="space-y-6">
        <WizardStepHeader
          eyebrow="Step 5 · Financial"
          title="Financial rule"
          description="How much, how often, and what happens on payout or missed contribution."
        />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
            <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
            <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
          </div>
          <div className="h-11 animate-pulse rounded-2xl bg-content/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        eyebrow="Step 5 · Financial"
        title="Financial rule"
        description={
          hasActive
            ? "This saves a new version — history is kept, nothing is overwritten."
            : "How much, how often, and what happens on payout or missed contribution."
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WizardField label="Contribution frequency">
            <Select
              value={draft.contribution_frequency}
              onValueChange={(v) =>
                updateDraft({ contribution_frequency: v as ContributionFrequency })
              }
            >
              <SelectTrigger className={`${fieldClassName} flex items-center justify-between`}>
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
          </WizardField>
          <WizardField label="Contribution amount" htmlFor="contribution-amount">
            <Input
              id="contribution-amount"
              type="number"
              min={0}
              value={draft.contribution_amount ?? ""}
              onChange={(e) => updateDraft({ contribution_amount: Number(e.target.value) })}
              className={fieldClassName}
            />
          </WizardField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WizardField label="Currency" htmlFor="currency">
            <Input
              id="currency"
              value={draft.currency ?? ""}
              onChange={(e) => updateDraft({ currency: e.target.value.toUpperCase() })}
              placeholder="NGN"
              maxLength={3}
              className={fieldClassName}
            />
          </WizardField>
          <WizardField label="Grace period (days)" htmlFor="grace-period-days">
            <Input
              id="grace-period-days"
              type="number"
              min={0}
              value={draft.grace_period_days ?? ""}
              onChange={(e) => updateDraft({ grace_period_days: Number(e.target.value) })}
              className={fieldClassName}
            />
          </WizardField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WizardField label="Penalty type">
            <Select
              value={draft.penalty_type}
              onValueChange={(v) => updateDraft({ penalty_type: v as PenaltyType })}
            >
              <SelectTrigger className={`${fieldClassName} flex items-center justify-between`}>
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
          </WizardField>
          {needsPenaltyValue && (
            <WizardField
              label={`Penalty value${draft.penalty_type === "pct" ? " (%)" : ""}`}
              htmlFor="penalty-value"
            >
              <Input
                id="penalty-value"
                type="number"
                min={0}
                value={draft.penalty_value ?? ""}
                onChange={(e) => updateDraft({ penalty_value: Number(e.target.value) })}
                className={fieldClassName}
              />
            </WizardField>
          )}
        </div>

        <WizardField label="Payout strategy">
          <Select
            value={draft.payout_strategy}
            onValueChange={(v) => updateDraft({ payout_strategy: v as PayoutStrategy })}
          >
            <SelectTrigger className={`${fieldClassName} flex items-center justify-between`}>
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
        </WizardField>

        {needsRotationOrder && (
          <WizardField label="Rotation order">
            <Select
              value={draft.rotation_order}
              onValueChange={(v) => updateDraft({ rotation_order: v as RotationOrder })}
            >
              <SelectTrigger className={`${fieldClassName} flex items-center justify-between`}>
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
          </WizardField>
        )}
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
