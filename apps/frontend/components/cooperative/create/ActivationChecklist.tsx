"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCooperativeCreationStore, type WizardStepId } from "@/stores/cooperative-creation-store";
import CooperativeService from "@/services/cooperative-service";
import RulesService from "@/services/rules-service";
import { MissingFieldsBanner } from "@/components/cooperative/MissingFieldsBanner";
import { getApiErrorDetail } from "@/lib/api-error";
import type { RequiredRuleType } from "@/types/cooperative";

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
      <p className="text-sm text-muted-foreground">
        Create the cooperative in Step 1 first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review & activate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          "{basicsDraft.name}" — once activated, members can start
          contributing under these rules.
        </p>
      </div>

      {checking ? (
        <p className="text-sm text-muted-foreground">Checking setup…</p>
      ) : (
        <ul className="space-y-2">
          {(Object.keys(RULE_LABELS) as RequiredRuleType[]).map((type) => {
            const isMissing = missing.includes(type);
            return (
              <li
                key={type}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="flex items-center gap-2 text-sm">
                  {isMissing ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {RULE_LABELS[type]}
                </span>
                {isMissing && (
                  <button
                    type="button"
                    className="text-xs underline underline-offset-2"
                    onClick={() => goToStep(type as WizardStepId)}
                  >
                    Add it
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {activateError && <p className="text-sm text-destructive">{activateError}</p>}

      {missing.length > 0 && !checking && (
        <MissingFieldsBanner
          title="Setup incomplete"
          missing={missing}
          getLabel={(key) => RULE_LABELS[key as RequiredRuleType] ?? key}
          onFix={(key) => goToStep(key as WizardStepId)}
        />
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={checking || missing.length > 0 || activating} onClick={handleActivate}>
          {activating ? "Activating…" : "Activate cooperative"}
        </Button>
      </div>
    </div>
  );
}