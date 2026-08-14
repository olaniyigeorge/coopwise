"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import CooperativeService from "@/services/cooperative-service";
import type { CoopModel } from "@/types/cooperative";

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
        <div>
          <h2 className="text-xl font-semibold">Cooperative basics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            &quot;{basicsDraft.name}&apos; has already been created — continue to set up its rules.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onContinue}>Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Cooperative basics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Type: {coopModel ? COOP_MODEL_LABELS[coopModel] : "—"}{" "}
          <button
            type="button"
            className="underline underline-offset-2 text-xs"
            onClick={() => useCooperativeCreationStore.getState().goToStep("type")}
          >
            change
          </button>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coop-name">Name</Label>
          <Input
            id="coop-name"
            value={basicsDraft.name ?? ""}
            onChange={(e) => updateBasicsDraft({ name: e.target.value })}
            placeholder="e.g. Lekki Traders Circle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coop-description">Description</Label>
          <Textarea
            id="coop-description"
            value={basicsDraft.description ?? ""}
            onChange={(e) => updateBasicsDraft({ description: e.target.value })}
            placeholder="What is this cooperative for?"
            rows={4}
          />
        </div>

        {/* Cover image upload deferred: FLAGGED — unconfirmed whether
            POST /cooperatives accepts a cover_image_url at creation or
            expects a separate multipart upload call afterward. Wiring
            this once that&apos;s confirmed. */}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => useCooperativeCreationStore.getState().goToStep("type")}
        >
          Back
        </Button>
        <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Creating…" : "Create cooperative"}
        </Button>
      </div>
    </div>
  );
}