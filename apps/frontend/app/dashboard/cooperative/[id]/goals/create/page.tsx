"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Target } from 'lucide-react'

import DashboardLayout from '@/components/dashboard/layout'
import CooperativeService from '@/services/cooperative-service'
import { Cooperative } from '@/types/cooperative'
import { cn } from '@/lib/utils'
import { useGoalCreationStore, type GoalWizardStepId } from '@/stores/goal-creation-store'
import { GoalBasicsStep } from '@/components/cooperative/goal-create/GoalBasicsStep'
import { GoalContractStep } from '@/components/cooperative/goal-create/GoalContractStep'
import { GoalOwnershipStep } from '@/components/cooperative/goal-create/GoalOwnershipStep'
import { GoalReviewStep } from '@/components/cooperative/goal-create/GoalReviewStep'

const STEP_LABELS: Record<GoalWizardStepId, string> = {
  basics: 'Basics',
  contract: 'Terms',
  ownership: 'Ownership',
  review: 'Review',
}

function WizardProgress({ steps, current }: { steps: GoalWizardStepId[]; current: GoalWizardStepId }) {
  const currentIdx = steps.indexOf(current)
  return (
    <nav aria-label="Goal setup progress" className="mb-6 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1.5">
        {steps.map((step, idx) => {
          const done = idx < currentIdx
          const active = idx === currentIdx
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
                aria-current={active ? 'step' : undefined}
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
                    done && "bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]",
                    !active && !done && "bg-content/[0.06] text-content/40"
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : idx + 1}
                </span>
                {STEP_LABELS[step]}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function CreateGoalPage() {
  const params = useParams()
  const router = useRouter()
  const cooperativeId = params?.id as string

  const [cooperative, setCooperative] = useState<Cooperative | null>(null)
  const [fetchingData, setFetchingData] = useState(true)

  const currentStep = useGoalCreationStore((s) => s.currentStep)
  const goToStep = useGoalCreationStore((s) => s.goToStep)
  const selectedPatternCode = useGoalCreationStore((s) => s.selectedPatternCode)
  const startForCooperative = useGoalCreationStore((s) => s.startForCooperative)

  useEffect(() => {
    if (cooperativeId) startForCooperative(cooperativeId)
  }, [cooperativeId, startForCooperative])

  useEffect(() => {
    if (!cooperativeId) return
    setFetchingData(true)
    CooperativeService.getCooperative(cooperativeId)
      .then(setCooperative)
      .finally(() => setFetchingData(false))
  }, [cooperativeId])

  // Ownership shares only apply to the pooled_for_shared pattern.
  const steps: GoalWizardStepId[] =
    selectedPatternCode === 'pooled_for_shared'
      ? ['basics', 'contract', 'ownership', 'review']
      : ['basics', 'contract', 'review']

  function goNext() {
    const idx = steps.indexOf(currentStep)
    goToStep(steps[Math.min(idx + 1, steps.length - 1)])
  }

  function goBack() {
    const idx = steps.indexOf(currentStep)
    goToStep(steps[Math.max(idx - 1, 0)])
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5 pb-6">
        <div>
          <button
            onClick={() => router.push(`/dashboard/cooperative/${cooperativeId}`)}
            className="inline-flex items-center text-sm font-medium text-content/50 transition-colors hover:text-content"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to cooperative
          </button>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-[24px] border border-content/[0.06] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:flex-row sm:items-center">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
              Creating a goal for
            </span>
            {fetchingData ? (
              <div className="mt-1.5 h-7 w-40 animate-pulse rounded-lg bg-content/[0.06]" />
            ) : (
              <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight text-content">
                {cooperative?.name}
              </h1>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-content/10 bg-content/[0.02] px-3 py-1.5 text-[11px] font-semibold text-content/50">
            <Target className="h-4 w-4 text-[#17603F] dark:text-[#7FBF9C]" />
            Cooperative goal
          </div>
        </div>

        <div className="rounded-[24px] border border-content/[0.06] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
          <WizardProgress steps={steps} current={currentStep} />

          {currentStep === 'basics' && (
            <GoalBasicsStep cooperativeId={cooperativeId} onContinue={goNext} />
          )}
          {currentStep === 'contract' && (
            <GoalContractStep cooperativeId={cooperativeId} onContinue={goNext} onBack={goBack} />
          )}
          {currentStep === 'ownership' && (
            <GoalOwnershipStep cooperativeId={cooperativeId} onContinue={goNext} onBack={goBack} />
          )}
          {currentStep === 'review' && (
            <GoalReviewStep
              onDone={() => router.push(`/dashboard/cooperative/${cooperativeId}`)}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
