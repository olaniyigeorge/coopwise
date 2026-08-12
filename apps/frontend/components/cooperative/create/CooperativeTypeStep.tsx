"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import type { CoopModel, CreateFinancialRulePayload } from "@/types/cooperative";
import { cn } from "@/lib/utils";

interface CoopTypeOption {
  model: CoopModel;
  title: string;
  blurb: string;
  // Defaults are pre-fills, not enforced constraints — user can change
  // every one of these later in Steps 4 and 7.
  financialDefaults: Partial<CreateFinancialRulePayload>;
}

const OPTIONS: CoopTypeOption[] = [
  {
    model: "ajo",
    title: "Ajo",
    blurb: "A rotating group where each member takes a turn receiving the full pot.",
    financialDefaults: { contribution_frequency: "weekly", payout_strategy: "rotating" },
  },
  {
    model: "esusu",
    title: "Esusu",
    blurb: "Fixed-cycle rotating savings, usually among a tight-knit group.",
    financialDefaults: { contribution_frequency: "weekly", payout_strategy: "rotating" },
  },
  {
    model: "adashe",
    title: "Adashe",
    blurb: "Rotating contributions with a set order agreed up front.",
    financialDefaults: { contribution_frequency: "monthly", payout_strategy: "rotating" },
  },
  {
    model: "chama",
    title: "Chama",
    blurb: "A member-run group that can save, invest, or fund shared goals together.",
    financialDefaults: { contribution_frequency: "monthly", payout_strategy: "pooled" },
  },
  {
    model: "coop",
    title: "Co-op",
    blurb: "A flexible cooperative structure you configure from scratch.",
    financialDefaults: {},
  },
];

interface CooperativeTypeStepProps {
  onContinue: () => void;
}

export function CooperativeTypeStep({ onContinue }: CooperativeTypeStepProps) {
  const coopModel = useCooperativeCreationStore((s) => s.coopModel);
  const setCoopModel = useCooperativeCreationStore((s) => s.setCoopModel);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What kind of cooperative is this?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This just sets sensible defaults for the steps ahead — you can change
          anything it pre-fills.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const selected = coopModel === opt.model;
          return (
            <Card
              key={opt.model}
              role="button"
              tabIndex={0}
              onClick={() => setCoopModel(opt.model, opt.financialDefaults)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setCoopModel(opt.model, opt.financialDefaults);
                }
              }}
              className={cn(
                "p-4 cursor-pointer transition-colors border-2",
                selected ? "border-primary" : "border-transparent hover:border-muted"
              )}
            >
              <h3 className="font-medium">{opt.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{opt.blurb}</p>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button disabled={!coopModel} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}