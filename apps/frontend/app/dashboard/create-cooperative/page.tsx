"use client";

import { useRouter } from "next/navigation";
import { useCooperativeCreationStore, type WizardStepId } from "@/stores/cooperative-creation-store";
import { CooperativeTypeStep } from "@/components/cooperative/create/CooperativeTypeStep";
import { CooperativeBasicsForm } from "@/components/cooperative/create/CooperativeBasicsForm";
import { GovernanceRuleForm } from "@/components/cooperative/create/GovernanceRuleForm";
import { MembershipRuleForm } from "@/components/cooperative/create/MembershipRuleForm";
import { FinancialRuleForm } from "@/components/cooperative/create/FinancialRuleForm";
import { DecisionRulesStep } from "@/components/cooperative/create/DecisionRulesStep";
import { ActivationChecklist } from "@/components/cooperative/create/ActivationChecklist";
import DashboardLayout from "@/components/dashboard/layout";

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
    <ol className="flex flex-wrap gap-2 text-xs mb-8">
      {STEP_ORDER.map((step, idx) => (
        <li
          key={step}
          className={
            idx === currentIdx
              ? "font-semibold text-foreground"
              : idx < currentIdx
              ? "text-muted-foreground"
              : "text-muted-foreground/50"
          }
        >
          {idx > 0 && <span className="mr-2">›</span>}
          {STEP_LABELS[step]}
        </li>
      ))}
    </ol>
  );
}

export default function CreateCooperativePage() {
  const router = useRouter();
  const currentStep = useCooperativeCreationStore((s) => s.currentStep);
  const nextStep = useCooperativeCreationStore((s) => s.nextStep);
  const prevStep = useCooperativeCreationStore((s) => s.prevStep);

  function handleActivated(cooperativeId: string) {
    // Step 6 -> deep-link straight into "add your first goal" (design doc §2).
    router.push(`/dashboard/cooperative/${cooperativeId}/goals/create`);
  }

  return (
    <DashboardLayout>
    <div className="max-w-2xl mx-auto py-6">
      <WizardProgress current={currentStep} />

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
    </div>
    </DashboardLayout>
  );
}