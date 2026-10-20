"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import CooperativeService from "@/services/cooperative-service";
import type { CoopModel } from "@/types/cooperative";
import {
  WizardActions,
  WizardButton,
  WizardField,
  WizardStepHeader,
  fieldClassName,
} from "@/components/cooperative/create/wizard-ui";

const COOP_MODEL_LABELS: Record<CoopModel, string> = {
  ajo: "Ajo",
  esusu: "Esusu",
  adashe: "Adashe",
  chama: "Chama",
  coop: "Co-op",
};

interface CooperativeBasicsFormProps {
  onContinue: () => void;
}

export function CooperativeBasicsForm({ onContinue }: CooperativeBasicsFormProps) {
  const coopModel = useCooperativeCreationStore((s) => s.coopModel);
  const basicsDraft = useCooperativeCreationStore((s) => s.basicsDraft);
  const updateBasicsDraft = useCooperativeCreationStore((s) => s.updateBasicsDraft);
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const setCooperativeId = useCooperativeCreationStore((s) => s.setCooperativeId);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!(basicsDraft.name?.trim() && coopModel);

  async function handleSubmit() {
    if (!coopModel || !basicsDraft.name?.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const coop = await CooperativeService.createCooperative({
        name: basicsDraft.name.trim(),
        description: basicsDraft.description?.trim() || undefined,
        coop_model: coopModel,
      });
      setCooperativeId(coop.id);
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cooperative");
    } finally {
      setSubmitting(false);
    }
  }

  // Already created in an earlier session (resumed draft) — basics is a
  // one-shot POST, not a versioned rule, so once cooperativeId exists this
  // step is done; just let people move on.
  if (cooperativeId) {
    return (
      <div className="space-y-6">
        <WizardStepHeader
          eyebrow="Step 2 · Basics"
          title="Cooperative basics"
          description={
            <>
              &quot;{basicsDraft.name}&quot; has already been created — continue to
              set up its rules.
            </>
          }
        />
        <WizardActions className="justify-end">
          <WizardButton onClick={onContinue}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </WizardButton>
        </WizardActions>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        eyebrow="Step 2 · Basics"
        title="Cooperative basics"
        description={
          <>
            Model:{" "}
            <span className="font-semibold text-content/70">
              {coopModel ? COOP_MODEL_LABELS[coopModel] : "—"}
            </span>{" "}
            <button
              type="button"
              className="text-xs font-semibold text-[#0E3B2E] underline decoration-[#0E3B2E]/30 underline-offset-2 hover:decoration-[#0E3B2E] dark:text-[#7FBF9C] dark:decoration-[#7FBF9C]/30 dark:hover:decoration-[#7FBF9C]"
              onClick={() => useCooperativeCreationStore.getState().goToStep("type")}
            >
              change
            </button>
          </>
        }
      />

      <div className="space-y-4">
        <WizardField label="Name" htmlFor="coop-name">
          <Input
            id="coop-name"
            value={basicsDraft.name ?? ""}
            onChange={(e) => updateBasicsDraft({ name: e.target.value })}
            placeholder="e.g. Lekki Traders Circle"
            className={fieldClassName}
          />
        </WizardField>

        <WizardField
          label="Description"
          htmlFor="coop-description"
          optional
          hint="A line or two helps invitees know what they're joining."
        >
          <Textarea
            id="coop-description"
            value={basicsDraft.description ?? ""}
            onChange={(e) => updateBasicsDraft({ description: e.target.value })}
            placeholder="What is this cooperative for?"
            rows={4}
            className={`${fieldClassName} h-auto min-h-[112px] py-3`}
          />
        </WizardField>

        {/* Cover image upload deferred: FLAGGED — unconfirmed whether
            POST /cooperatives accepts a cover_image_url at creation or
            expects a separate multipart upload call afterward. Wiring
            this once that&apos;s confirmed. */}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <WizardActions>
        <WizardButton
          variant="ghost"
          onClick={() => useCooperativeCreationStore.getState().goToStep("type")}
        >
          Back
        </WizardButton>
        <WizardButton disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Creating…" : "Create cooperative"}
        </WizardButton>
      </WizardActions>
    </div>
  );
}
