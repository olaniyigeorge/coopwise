"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  IdCard,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { getKYCOverview, startKYC } from '@/services/kyc-service'
import { STAGE_ORDER, type KYCStepStatus, type KYCOverview } from '@/types/kyc'
import StageStatusBadge from '@/components/dashboard/kyc/stage-status-badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api-error'

const STAGE_ICONS = [UserRound, MapPin, IdCard, Landmark]

const STAGE_DESCRIPTIONS = [
  'Legal name, date of birth and how you earn',
  'Where you live and who to contact',
  'A government ID, selfie and short liveness video',
  'The account your payouts go to',
]

// A 404 here simply means no KYC record exists yet.
function isNotFoundError(err: unknown): boolean {
  return err instanceof ApiError
    ? err.status === 404
    : err instanceof Error && err.message.includes('API request failed (404)')
}

function ProgressRing({ value }: { value: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" role="img" aria-label={`${value}% complete`}>
      <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/10" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-[#E8BC63] transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  )
}

export default function KYCOverviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [overview, setOverview] = useState<KYCOverview | null>(null)
  const [hasNoRecord, setHasNoRecord] = useState(false)

  const loadOverview = () => {
    setLoading(true)
    getKYCOverview()
      .then((data) => {
        setOverview(data)
        setHasNoRecord(false)
      })
      .catch((err) => {
        if (isNotFoundError(err)) {
          // User hasn't started KYC yet — this is expected, not an error state.
          setOverview(null)
          setHasNoRecord(true)
        } else {
          console.error('Failed to load KYC overview:', err)
          toast.error('Failed to load KYC status', {
            description: 'Please refresh the page and try again.',
          })
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOverview()
  }, [])

  const stages = overview?.steps ?? []
  const isVerified = overview?.overall_status === 'verified'

  const submittedCount = stages.filter((s) => s.status === 'submitted').length
  const approvedCount = stages.filter((s) => s.status === 'approved').length
  const rejectedCount = stages.filter((s) => s.status === 'rejected').length
  const totalStages = STAGE_ORDER.length
  const progress = Math.round((approvedCount / totalStages) * 100)
  const completedCount = approvedCount + submittedCount

  const currentStageIndex = Math.max(
    0,
    STAGE_ORDER.findIndex((s) => s.step === overview?.current_step)
  )

  const goToStage = (index: number) => router.push(`/dashboard/kyc/verify?stage=${index + 1}`)

  const handleContinueClick = async () => {
    if (!hasNoRecord) {
      goToStage(currentStageIndex)
      return
    }

    setStarting(true)
    try {
      await startKYC()

      // Re-fetch so the wizard opens on the record's real current step.
      // If the summary isn't available yet, stage 1 is still the right place.
      let nextIndex = 0
      try {
        const data = await getKYCOverview()
        setOverview(data)
        setHasNoRecord(false)
        nextIndex = Math.max(
          0,
          STAGE_ORDER.findIndex((s) => s.step === data.current_step)
        )
      } catch {
        nextIndex = 0
      }

      goToStage(nextIndex)
    } catch (err) {
      console.error('Failed to start KYC:', err)
      toast.error('Failed to start KYC', {
        description: 'Please try again in a moment.',
      })
    } finally {
      setStarting(false)
    }
  }

  const statusCopy = loading
    ? {
        kicker: 'Checking',
        title: 'Loading your verification status',
        body: 'One moment while we pull your latest stages from the ledger.',
      }
    : isVerified
    ? {
        kicker: 'All clear',
        title: 'Your account is verified',
        body: 'Every stage has been approved. You have full access to contributions, payouts and cooperative tools.',
      }
    : hasNoRecord
      ? {
          kicker: 'Not started',
          title: 'Verify your identity',
          body: 'Four short stages — personal details, address, ID and bank account. It usually takes under ten minutes.',
        }
      : rejectedCount > 0
        ? {
            kicker: 'Action needed',
            title: 'A stage needs another look',
            body: `${rejectedCount} stage${rejectedCount === 1 ? '' : 's'} came back with a note. Fix the details and resubmit.`,
          }
        : {
            kicker: 'In progress',
            title: 'Continue where you left off',
            body: `${completedCount} of ${totalStages} stages done. Finish the rest and we'll review your submission.`,
          }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-10">

        {/* ── Header ── */}
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8892B]">
            Account verification
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
            KYC verification
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
            Confirm who you are so your cooperative can trust the ledger — and you can move money without limits.
          </p>
        </header>

        {/* ── Status hero ── */}
        <section className="relative overflow-hidden rounded-[26px] bg-[#0B1712] p-6 text-brand-paper shadow-[0_20px_50px_-30px_rgba(11,23,18,0.7)] sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(232,188,99,0.22),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(127,191,156,0.16),transparent_45%)]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <ProgressRing value={isVerified ? 100 : progress} />
                <span className="absolute inset-0 flex items-center justify-center">
                  {isVerified ? (
                    <BadgeCheck className="h-6 w-6 text-[#E8BC63]" strokeWidth={1.8} />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-[#E8BC63]" strokeWidth={1.8} />
                  )}
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E8BC63]">
                  {statusCopy.kicker}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                  {statusCopy.title}
                </h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-white/55">
                  {statusCopy.body}
                </p>
              </div>
            </div>

            {!isVerified && (
              <Button
                size="sm"
                onClick={handleContinueClick}
                disabled={loading || starting}
                className="h-10 shrink-0 rounded-full bg-[#E8BC63] px-5 text-sm font-semibold text-[#0B1712] hover:bg-[#F0CD82] disabled:bg-white/10 disabled:text-white/40"
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {hasNoRecord ? 'Start KYC' : 'Continue KYC'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </section>

        {/* ── Progress figures ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Approved', value: approvedCount, tone: 'text-[#0E3B2E] dark:text-[#7FBF9C]' },
            { label: 'In review', value: submittedCount, tone: 'text-[#B8892B]' },
            { label: 'Needs work', value: rejectedCount, tone: 'text-red-600 dark:text-red-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-content/10 bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(11,23,18,0.04)]"
            >
              <p className={cn('font-display text-2xl font-bold tabular-nums', stat.tone)}>
                {stat.value}
                <span className="text-sm font-medium text-content/30">/{totalStages}</span>
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-content/45">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Stage list ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-content">Verification stages</h2>
            <span className="text-[11px] text-content/40">
              {approvedCount} of {totalStages} complete
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-content/[0.04]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {STAGE_ORDER.map((stage, index) => {
                const stageData = stages.find((s) => s.step === stage.step)
                const status: KYCStepStatus = stageData?.status ?? 'pending'
                const isLocked = hasNoRecord
                  ? index > 0
                  : status === 'approved'
                    ? true
                    : index > currentStageIndex && status === 'pending'
                const isCurrent = !isVerified && !isLocked && index === currentStageIndex
                const Icon = STAGE_ICONS[index] ?? ShieldCheck

                return (
                  <button
                    key={stage.step}
                    type="button"
                    onClick={() => {
                      if (isLocked) return
                      if (hasNoRecord) {
                        handleContinueClick()
                      } else {
                        goToStage(index)
                      }
                    }}
                    disabled={isLocked}
                    aria-label={`${stage.title}${isLocked ? ' (locked)' : ''}`}
                    className={cn(
                      'group relative flex items-start gap-3.5 rounded-2xl border bg-surface p-4 text-left shadow-[0_1px_2px_rgba(11,23,18,0.04)] transition-all',
                      isLocked
                        ? 'cursor-not-allowed border-content/10 opacity-55'
                        : 'border-content/10 hover:-translate-y-0.5 hover:border-[#0E3B2E]/25 hover:shadow-[0_10px_24px_-18px_rgba(11,23,18,0.5)] dark:hover:border-[#7FBF9C]/30',
                      isCurrent && 'border-[#B8892B]/50 ring-1 ring-[#B8892B]/25'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        status === 'approved'
                          ? 'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]'
                          : status === 'rejected'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : isCurrent
                              ? 'bg-[#B8892B]/12 text-[#B8892B]'
                              : 'bg-content/[0.05] text-content/45'
                      )}
                    >
                      {isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-content/30">
                          Step {String(index + 1).padStart(2, '0')}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#B8892B]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#B8892B]">
                            <Clock3 className="h-2.5 w-2.5" />
                            Now
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-content">
                        {stage.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-content/45">
                        {STAGE_DESCRIPTIONS[index]}
                      </span>
                      {stageData?.rejection_reason && status === 'rejected' && (
                        <span className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-500/[0.07] px-2 py-1.5 text-[11px] leading-relaxed text-red-600 dark:text-red-400">
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          {stageData.rejection_reason}
                        </span>
                      )}
                    </span>

                    <span className="mt-0.5 flex shrink-0 flex-col items-end gap-2">
                      <StageStatusBadge status={status} />
                      {status === 'approved' ? (
                        <Check className="h-4 w-4 text-[#17603F] dark:text-[#B7E3C3]" />
                      ) : !isLocked ? (
                        <ArrowRight className="h-4 w-4 text-content/25 transition-transform group-hover:translate-x-0.5 group-hover:text-content/60" />
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {!isVerified && (
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-content/35">
            <Lock className="h-3 w-3" />
            Documents are encrypted and only visible to your cooperative&apos;s reviewers.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
