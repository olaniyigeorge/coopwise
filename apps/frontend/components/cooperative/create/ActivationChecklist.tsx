"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCooperativeCreationStore, type WizardStepId } from "@/stores/cooperative-creation-store";
import CooperativeService from "@/services/cooperative-service";
import RulesService from "@/services/rules-service";
import { MissingFieldsBanner } from "@/components/cooperative/MissingFieldsBanner";
import { getApiErrorDetail } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { RequiredRuleType } from "@/types/cooperative";
import {
  WizardActions,
  WizardButton,
  WizardStepHeader,
} from "@/components/cooperative/create/wizard-ui";

const RULE_LABELS: Record<RequiredRuleType, string> = {
  governance: "Governance rule",
  membership: "Membership rule",
  financial: "Financial rule",
};

interface ActivationChecklistProps {
  onActivated: (cooperativeId: string) => void;
  onBack: () => void;
}

export function ActivationChecklist({ onActivated, onBack }: ActivationChecklistProps) {
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const basicsDraft = useCooperativeCreationStore((s) => s.basicsDraft);
  const goToStep = useCooperativeCreationStore((s) => s.goToStep);
  const reset = useCooperativeCreationStore((s) => s.reset);

  const [checking, setChecking] = useState(true);
  const [missing, setMissing] = useState<RequiredRuleType[]>([]);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  // Re-check against the backend rather than trusting local wizard state
  // alone — this is the source of truth activate() itself will check, and
  // the person may be resuming a session where local flags are stale.
  useEffect(() => {
    if (!cooperativeId) return;
    let cancelled = false;
    setChecking(true);
    RulesService.getActiveRequiredRules(cooperativeId)
      .then(({ missing }) => {
        if (!cancelled) setMissing(missing);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cooperativeId]);

  async function handleActivate() {
    if (!cooperativeId || missing.length > 0) return;
    setActivating(true);
    setActivateError(null);
    try {
      await CooperativeService.activateCooperative(cooperativeId);
      const doneId = cooperativeId;
      reset();
      onActivated(doneId);
    } catch (err) {
      const detail = getApiErrorDetail(err);
      if (detail?.missing) {
        setMissing(detail.missing as RequiredRuleType[]);
      } else {
        setActivateError(err instanceof Error ? err.message : "Failed to activate");
      }
    } finally {
      setActivating(false);
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
        eyebrow="Step 7 · Review"
        title="Review & activate"
        description={
          <>
            &quot;{basicsDraft.name}&quot; — once activated, members can start
            contributing under these rules.
          </>
        }
      />

      {checking ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-[68px] animate-pulse rounded-2xl bg-content/5" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {(Object.keys(RULE_LABELS) as RequiredRuleType[]).map((type) => {
            const isMissing = missing.includes(type);
            return (
              <li
                key={type}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border p-4",
                  isMissing
                    ? "border-[#EAD9AC] bg-[#FBF3DE] dark:border-[#5A4A22] dark:bg-[#2E2818]"
                    : "border-[#CFE6D6] bg-[#EFF7F1] dark:border-[#2C4A39] dark:bg-[#17281F]"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isMissing
                        ? "bg-white/70 text-[#A8491F] dark:bg-white/10 dark:text-[#E8BC63]"
                        : "bg-white/70 text-[#17603F] dark:bg-white/10 dark:text-[#B7E3C3]"
                    )}
                  >
                    {isMissing ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-content">
                      {RULE_LABELS[type]}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-content/50">
                      {isMissing ? "Needs setup before activation" : "Configured"}
                    </span>
                  </span>
                </span>
                {isMissing && (
                  <WizardButton
                    size="sm"
                    variant="secondary"
                    onClick={() => goToStep(type as WizardStepId)}
                  >
                    Add it
                  </WizardButton>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {activateError && (
        <p className="text-sm text-red-600 dark:text-red-400">{activateError}</p>
      )}

      {missing.length > 0 && !checking && (
        <MissingFieldsBanner
          title="Setup incomplete"
          missing={missing}
          getLabel={(key) => RULE_LABELS[key as RequiredRuleType] ?? key}
          onFix={(key) => goToStep(key as WizardStepId)}
        />
      )}

      <WizardActions>
        <WizardButton variant="ghost" onClick={onBack}>
          Back
        </WizardButton>
        <WizardButton
          disabled={checking || missing.length > 0 || activating}
          onClick={handleActivate}
        >
          {activating ? "Activating…" : "Activate cooperative"}
        </WizardButton>
      </WizardActions>
    </div>
  );
}
