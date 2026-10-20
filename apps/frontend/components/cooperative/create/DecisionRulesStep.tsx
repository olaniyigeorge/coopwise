"use client";

import { useEffect, useState } from "react";
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
import type { DecisionMechanism, DecisionType } from "@/types/cooperative";
import {
  WizardActions,
  WizardButton,
  WizardStepHeader,
  fieldClassName,
} from "@/components/cooperative/create/wizard-ui";
import { cn } from "@/lib/utils";

const DECISION_TYPES: DecisionType[] = [
  "payout_order",
  "dispute_resolution",
  "exit_valuation",
  "rule_amendment",
  "new_member_approval",
];

const DECISION_META: Record<
  DecisionType,
  { label: string; description: string; recommended: DecisionMechanism; options: DecisionMechanism[] }
> = {
  payout_order: {
    label: "Who gets paid next",
    description: "The order members receive the pot in.",
    recommended: "rotation",
    options: ["rotation", "lottery", "vote", "admin"],
  },
  dispute_resolution: {
    label: "Settling disagreements",
    description: "What happens when members don't agree.",
    recommended: "admin",
    options: ["admin", "vote"],
  },
  exit_valuation: {
    label: "Leaving members' shares",
    description: "How a member's share is valued when they exit.",
    recommended: "vote",
    options: ["vote", "admin"],
  },
  rule_amendment: {
    label: "Changing the rules",
    description: "How an amendment to the rules gets approved.",
    recommended: "vote",
    options: ["vote", "admin"],
  },
  new_member_approval: {
    label: "Letting new members in",
    description: "Who approves a join request.",
    recommended: "vote",
    options: ["admin", "vote", "lottery"],
  },
};

const MECHANISM_META: Record<DecisionMechanism, { label: string; hint: string }> = {
  admin: { label: "An admin decides", hint: "Fastest — one trusted person calls it." },
  vote: { label: "Members vote", hint: "Everyone gets a say." },
  rotation: { label: "Take turns", hint: "Follows the payout rotation." },
  lottery: { label: "Random draw", hint: "Fair and unbiased." },
  ai_suggested: { label: "CoopWise suggests", hint: "Get a recommendation, then confirm." },
};

interface DecisionRulesStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export function DecisionRulesStep({ onContinue, onBack }: DecisionRulesStepProps) {
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const decisionDrafts = useCooperativeCreationStore((s) => s.decisionDrafts);
  const toggleDecisionType = useCooperativeCreationStore((s) => s.toggleDecisionType);
  const updateDecisionDraft = useCooperativeCreationStore((s) => s.updateDecisionDraft);

  // Mechanisms already saved for this cooperative — used to prefill the
  // toggles and to avoid writing a redundant new version on Continue.
  const [activeMechanisms, setActiveMechanisms] = useState<
    Partial<Record<DecisionType, DecisionMechanism>>
  >({});
  const [loadingActive, setLoadingActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cooperativeId) return;
    let cancelled = false;

    Promise.allSettled(
      DECISION_TYPES.map((type) =>
        RulesService.getActiveDecisionRule(cooperativeId, type)
      )
    )
      .then((results) => {
        if (cancelled) return;
        const saved: Partial<Record<DecisionType, DecisionMechanism>> = {};
        results.forEach((result, idx) => {
          if (result.status !== "fulfilled" || !result.value?.mechanism) return;
          const type = DECISION_TYPES[idx];
          saved[type] = result.value.mechanism;
          toggleDecisionType(type, true);
          updateDecisionDraft(type, { mechanism: result.value.mechanism });
        });
        setActiveMechanisms(saved);
      })
      .finally(() => {
        if (!cancelled) setLoadingActive(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooperativeId]);

  function handleToggle(type: DecisionType, enabled: boolean) {
    toggleDecisionType(type, enabled);
    // Switching a rule on picks its recommended mechanism, so Continue is
    // never blocked by an empty select the member didn't notice.
    if (enabled && !decisionDrafts[type].values.mechanism) {
      updateDecisionDraft(type, { mechanism: DECISION_META[type].recommended });
    }
  }

  async function handleContinue() {
    if (!cooperativeId) return;

    const enabled = DECISION_TYPES.filter((type) => decisionDrafts[type].enabled);
    const missing = enabled.filter((type) => !decisionDrafts[type].values.mechanism);
    if (missing.length > 0) {
      setError("Pick how each enabled situation is decided.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      for (const type of enabled) {
        const mechanism = decisionDrafts[type].values.mechanism as DecisionMechanism;
        if (activeMechanisms[type] === mechanism) continue;
        await RulesService.createDecisionRule(cooperativeId, {
          decision_type: type,
          mechanism,
        });
      }
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision rules");
    } finally {
      setSaving(false);
    }
  }

  if (!cooperativeId) {
    return (
      <div className="rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] p-4 text-sm text-[#6B4E12] dark:border-[#5A4A22] dark:bg-[#2E2818] dark:text-[#E8BC63]">
        Create the cooperative in Step 2 first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        eyebrow="Step 6 · Decision rules"
        title="Who decides what"
        description="Optional. Turn on the situations you want settled now — the rest can be added later, and none of these block activation."
      />

      <div className="space-y-3">
        {DECISION_TYPES.map((type) => {
          const meta = DECISION_META[type];
          const draft = decisionDrafts[type];
          const mechanism = draft.values.mechanism as DecisionMechanism | undefined;
          return (
            <div
              key={type}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                draft.enabled
                  ? "border-[#0E3B2E]/25 bg-[#DFF0E4]/25 dark:border-[#7FBF9C]/25 dark:bg-[#1C3A2C]/25"
                  : "border-content/10 bg-content/[0.02]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <Label
                  htmlFor={`decision-${type}`}
                  className="min-w-0 cursor-pointer"
                >
                  <span className="block text-sm font-semibold text-content">
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-content/50">
                    {meta.description}
                  </span>
                  {activeMechanisms[type] && (
                    <span className="mt-1 block text-[11px] leading-snug text-content/40">
                      Already saved — change how it&apos;s decided below.
                    </span>
                  )}
                </Label>
                <Switch
                  id={`decision-${type}`}
                  checked={draft.enabled}
                  disabled={loadingActive || !!activeMechanisms[type]}
                  onCheckedChange={(checked) => handleToggle(type, checked)}
                />
              </div>

              {draft.enabled && (
                <div className="mt-3 space-y-1.5">
                  <Select
                    value={mechanism ?? ""}
                    onValueChange={(value) =>
                      updateDecisionDraft(type, {
                        mechanism: value as DecisionMechanism,
                      })
                    }
                  >
                    <SelectTrigger
                      className={`${fieldClassName} flex items-center justify-between`}
                    >
                      <SelectValue placeholder="How is this decided?" />
                    </SelectTrigger>
                    <SelectContent>
                      {meta.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {MECHANISM_META[option].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mechanism && (
                    <p className="px-1 text-[11px] leading-relaxed text-content/40">
                      {MECHANISM_META[mechanism].hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <WizardActions>
        <WizardButton variant="ghost" onClick={onBack}>
          Back
        </WizardButton>
        <WizardButton disabled={saving || loadingActive} onClick={handleContinue}>
          {saving ? "Saving…" : "Continue"}
        </WizardButton>
      </WizardActions>
    </div>
  );
}
