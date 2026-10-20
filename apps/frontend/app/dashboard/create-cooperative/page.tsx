"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCooperativeCreationStore, type WizardStepId } from "@/stores/cooperative-creation-store";
import { CooperativeTypeStep } from "@/components/cooperative/create/CooperativeTypeStep";
import { CooperativeBasicsForm } from "@/components/cooperative/create/CooperativeBasicsForm";
import { GovernanceRuleForm } from "@/components/cooperative/create/GovernanceRuleForm";
import { MembershipRuleForm } from "@/components/cooperative/create/MembershipRuleForm";
import { FinancialRuleForm } from "@/components/cooperative/create/FinancialRuleForm";
import { DecisionRulesStep } from "@/components/cooperative/create/DecisionRulesStep";
import { ActivationChecklist } from "@/components/cooperative/create/ActivationChecklist";
import DashboardLayout from "@/components/dashboard/layout";
import { WizardPanel } from "@/components/cooperative/create/wizard-ui";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<WizardStepId, string> = {
  type: "Type",
  basics: "Basics",
  governance: "Governance",
  membership: "Membership",
  financial: "Financial",
  decision: "Decision rules",
  review: "Review & activate",
};

const STEP_ORDER: WizardStepId[] = [
  "type",
  "basics",
  "governance",
  "membership",
  "financial",
  "decision",
  "review",
];

function WizardProgress({ current }: { current: WizardStepId }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  return (
    <nav
      aria-label="Setup progress"
      className="overflow-x-auto rounded-[24px] bg-surface p-3 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-4"
    >
      <ol className="flex min-w-max items-center gap-1.5">
        {STEP_ORDER.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li key={step} className="flex items-center gap-1.5">
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px w-4 sm:w-6",
                    idx <= currentIdx
                      ? "bg-[#0E3B2E]/25 dark:bg-[#7FBF9C]/25"
                      : "bg-content/10"
                  )}
                />
              )}
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-[11px] font-semibold transition-colors sm:text-xs",
                  active && "bg-[#0E3B2E] text-white dark:bg-[#7FBF9C] dark:text-[#0B1712]",
                  done && "text-content/55",
                  !active && !done && "text-content/35"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    active && "bg-white/15 text-white dark:bg-[#0B1712]/10 dark:text-[#0B1712]",
                    done &&
                      "bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]",
                    !active && !done && "bg-content/[0.06] text-content/40"
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : idx + 1}
                </span>
                {STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function CreateCooperativePage() {
  const router = useRouter();
  const currentStep = useCooperativeCreationStore((s) => s.currentStep);
  const nextStep = useCooperativeCreationStore((s) => s.nextStep);
  const prevStep = useCooperativeCreationStore((s) => s.prevStep);
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  function handleActivated(cooperativeId: string) {
    // Step 6 -> deep-link straight into "add your first goal" (design doc §2).
    router.push(`/dashboard/cooperative/${cooperativeId}/goals/create`);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-4 pb-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
              New cooperative
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              Build your trust circle
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
              Pick a model and set the rules members will live by. Every rule
              save keeps a version — you can revise them later without losing
              history.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-content/10 px-3 py-1.5 text-[11px] font-semibold text-content/50 sm:self-auto">
            Step {currentIdx + 1} of {STEP_ORDER.length}
          </span>
        </header>

        <WizardProgress current={currentStep} />

        <WizardPanel className="sm:p-6 lg:p-8">
          {currentStep === "type" && <CooperativeTypeStep onContinue={nextStep} />}
          {currentStep === "basics" && <CooperativeBasicsForm onContinue={nextStep} />}
          {currentStep === "governance" && (
            <GovernanceRuleForm onContinue={nextStep} onBack={prevStep} />
          )}
          {currentStep === "membership" && (
            <MembershipRuleForm onContinue={nextStep} onBack={prevStep} />
          )}
          {currentStep === "financial" && (
            <FinancialRuleForm onContinue={nextStep} onBack={prevStep} />
          )}
          {currentStep === "decision" && (
            <DecisionRulesStep onContinue={nextStep} onBack={prevStep} />
          )}
          {currentStep === "review" && (
            <ActivationChecklist onActivated={handleActivated} onBack={prevStep} />
          )}
        </WizardPanel>
      </div>
    </DashboardLayout>
  );
}
