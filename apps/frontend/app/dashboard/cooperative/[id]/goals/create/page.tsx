"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Target } from 'lucide-react'

import DashboardLayout from '@/components/dashboard/layout'
import CooperativeService from '@/services/cooperative-service'
import { Cooperative } from '@/types/cooperative'
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
    <ol className="flex flex-wrap gap-2 text-xs mb-6">
      {steps.map((step, idx) => (
        <li
          key={step}
          className={
            idx === currentIdx
              ? 'font-semibold text-neutral-900'
              : idx < currentIdx
              ? 'text-neutral-500'
              : 'text-neutral-400'
          }
        >
          {idx > 0 && <span className="mr-2">›</span>}
          {STEP_LABELS[step]}
        </li>
      ))}
    </ol>
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/dashboard/cooperative/${cooperativeId}`)}
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Cooperative
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Creating Goal For
            </span>
            {fetchingData ? (
              <div className="h-6 w-40 bg-neutral-200 animate-pulse rounded mt-1" />
            ) : (
              <h1 className="text-xl font-bold text-neutral-900">{cooperative?.name}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
            <Target className="w-4 h-4 text-emerald-600" />
            Cooperative Target Goal
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white border border-neutral-100 shadow-sm rounded-2xl">
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
