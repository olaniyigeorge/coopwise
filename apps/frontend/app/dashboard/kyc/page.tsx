"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { getKYCOverview } from '@/services/kyc-service'
import { STAGE_ORDER, type KYCOverview } from '@/types/kyc'
import StageStatusBadge from '@/components/dashboard/kyc/stage-status-badge'

const STATUS_COPY: Record<KYCOverview['overall_status'], { label: string; className: string }> = {
  not_started: { label: 'Not started', className: 'bg-brand-ink/5 text-brand-ink/60' },
  in_progress: { label: 'In progress', className: 'bg-brand-gold/10 text-brand-gold' },
  pending_review: { label: 'Pending review', className: 'bg-brand-gold/10 text-brand-gold' },
  verified: { label: 'Verified', className: 'bg-primary/10 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
  expired: { label: 'Expired', className: 'bg-red-50 text-red-600' },
}

export default function KYCOverviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<KYCOverview | null>(null)

  useEffect(() => {
    getKYCOverview()
    .then((data) => {
      setOverview(data)
    })
  }, [])

  const stages = overview?.steps ?? []

  const submittedCount = stages.filter((s) => s.status == 'submitted').length
  const approvedCount = stages.filter((s) => s.status === 'approved').length
  const rejectedCount = stages.filter((s) => s.status === 'rejected').length

  const currentStageIndex = Math.max(
    0,
    STAGE_ORDER.findIndex((s) => s.step === overview?.current_step)
  )

  const goToStage = (index: number) => router.push(`/dashboard/kyc/verify?stage=${index + 1}`)

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">

        {/* ── Header ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink tracking-tight">
            KYC Verification
          </h1>
          <p className="text-sm text-brand-ink/55 mt-0.5">
            Complete the following stages to verify your account as an individual.
          </p>
        </div>

        {/* ── Current status ── */}
        <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Current Status</span>
            {overview && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COPY[overview.overall_status]?.className ?? ''}`}>
                {STATUS_COPY[overview.overall_status]?.label || overview.overall_status}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-ink">Continue KYC</p>
                <p className="text-xs text-brand-ink/50 mt-0.5">Continue from your current stage.</p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 sm:w-auto w-full"
              onClick={() => goToStage(currentStageIndex)}
              disabled={loading}
            >
              Continue KYC
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Progress overview ── */}
        <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-brand-ink mb-4">KYC Progress Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-display text-xl font-bold text-brand-ink">{submittedCount}/4</p>
              <p className="text-xs text-brand-ink/45 mt-0.5">Submitted</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-primary">{approvedCount}/4</p>
              <p className="text-xs text-brand-ink/45 mt-0.5">Approved</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-red-600">{rejectedCount}/4</p>
              <p className="text-xs text-brand-ink/45 mt-0.5">Rejected</p>
            </div>
          </div>
        </div>

        {/* ── Stage cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STAGE_ORDER.map((stage, index) => {
            const stageData = stages.find((s) => s.step === stage.step)
            const status = stageData?.status ?? 'pending'
            const isLocked = index > currentStageIndex && status === 'pending'

            return (
              <button
                key={stage.step}
                onClick={() => !isLocked && goToStage(index)}
                disabled={isLocked}
                className={`text-left bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-5 transition-colors ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-brand-ink/40 uppercase tracking-wide">{stage.label}</span>
                  <StageStatusBadge status={status} />
                </div>
                <p className="text-sm font-semibold text-brand-ink">{stage.title}</p>
                {stageData?.rejection_reason && status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-1.5">{stageData.rejection_reason}</p>
                )}
              </button>
            )
          })}
        </div>

      </div>
    </DashboardLayout>
  )
}