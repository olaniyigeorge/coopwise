"use client";

import type { ComponentType } from "react";
import {
  CalendarClock,
  CheckCircle2,
  HandCoins,
  Network,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import type { CoopModel } from "@/types/cooperative";
import { cn } from "@/lib/utils";
import {
  WizardActions,
  WizardButton,
  WizardStepHeader,
} from "@/components/cooperative/create/wizard-ui";

interface CoopTypeOption {
  model: CoopModel;
  title: string;
  blurb: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  iconClassName: string;
}

const OPTIONS: CoopTypeOption[] = [
  {
    model: "ajo",
    title: "Ajo",
    blurb: "A rotating group where each member takes a turn receiving the full pot.",
    icon: RefreshCw,
    iconClassName: "bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]",
  },
  {
    model: "esusu",
    title: "Esusu",
    blurb: "Fixed-cycle rotating savings, usually among a tight-knit group.",
    icon: Users,
    iconClassName: "bg-[#DCE8FB] text-[#24508F] dark:bg-[#1B2C44] dark:text-[#A9C5F0]",
  },
  {
    model: "adashe",
    title: "Adashe",
    blurb: "Rotating contributions with a set order agreed up front.",
    icon: CalendarClock,
    iconClassName: "bg-[#FBE2D6] text-[#A8491F] dark:bg-[#3B2820] dark:text-[#F0B49A]",
  },
  {
    model: "chama",
    title: "Chama",
    blurb: "A member-run group that can save, invest, or fund shared goals together.",
    icon: HandCoins,
    iconClassName: "bg-[#E4DCFA] text-[#5B3FA8] dark:bg-[#2A2140] dark:text-[#C4B4F0]",
  },
  {
    model: "coop",
    title: "Co-op",
    blurb: "A flexible cooperative structure you configure from scratch.",
    icon: Network,
    iconClassName: "bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]",
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
      <WizardStepHeader
        eyebrow="Step 1 · Model"
        title="What kind of cooperative is this?"
        description="This sets sensible defaults for the steps ahead — you can change anything it pre-fills."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const selected = coopModel === opt.model;
          const Icon = opt.icon;
          return (
            <button
              key={opt.model}
              type="button"
              aria-pressed={selected}
              onClick={() => setCoopModel(opt.model)}
              className={cn(
                "group relative flex flex-col items-start gap-3 rounded-[20px] border p-4 text-left transition-all",
                selected
                  ? "border-[#0E3B2E] bg-[#DFF0E4]/40 ring-1 ring-[#0E3B2E] dark:border-[#7FBF9C] dark:bg-[#1C3A2C]/40 dark:ring-[#7FBF9C]"
                  : "border-content/10 bg-content/[0.02] hover:border-content/20 hover:bg-content/[0.04]"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  opt.iconClassName
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-content">
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-content/55">
                  {opt.blurb}
                </span>
              </span>
              {selected && (
                <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-[#0E3B2E] dark:text-[#7FBF9C]" />
              )}
            </button>
          );
        })}
      </div>

      <WizardActions className="justify-end">
        <WizardButton disabled={!coopModel} onClick={onContinue}>
          Continue
        </WizardButton>
      </WizardActions>
    </div>
  );
}
