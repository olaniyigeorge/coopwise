"use client"

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { STAGE_ORDER } from '@/types/kyc'
import type {
  KYCPersonalInfoInput,
  KYCContactInfoInput,
  KYCIdentityVerificationInput,
  KYCBankingInfoInput,
} from '@/types/kyc'
import {
  submitPersonalInfo,
  submitContactInfo,
  submitIdentityVerification,
  submitBankingInfo,
} from '@/services/kyc-service'
import PersonalProfileForm from '@/components/dashboard/kyc/personal-profile-form'
import ContactAddressForm from '@/components/dashboard/kyc/contact-address-form'
import IdentityVerificationForm from '@/components/dashboard/kyc/identity-verification-form'
import BankingInfoForm from '@/components/dashboard/kyc/banking-info-form'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const EMPTY_PERSONAL: KYCPersonalInfoInput = {
  legal_full_name: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  employment_status: '',
  occupation_or_business_type: '',
  source_of_funds: '',
  monthly_income_range: '',
  income_currency: 'NGN',
}

const EMPTY_CONTACT: KYCContactInfoInput = {
  residential_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  next_of_kin_name: '',
  next_of_kin_phone: '',
}

const EMPTY_IDENTITY: KYCIdentityVerificationInput = {
  document_type: '',
  document_number: '',
  document_image_file: null,
  selfie_image_file: null,
  video_file: null,
}

const EMPTY_BANKING: KYCBankingInfoInput = {
  bank_name: '',
  bank_code: '',
  account_number: '',
  account_name: '',
}

const STAGE_SHORT = ['Personal', 'Address', 'Identity', 'Banking']

function KYCVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStage = Math.min(Math.max(Number(searchParams.get('stage') ?? 1), 1), 4)

  const [stageIndex, setStageIndex] = useState(initialStage - 1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [personal, setPersonal] = useState(EMPTY_PERSONAL)
  const [contact, setContact] = useState(EMPTY_CONTACT)
  const [identity, setIdentity] = useState(EMPTY_IDENTITY)
  const [banking, setBanking] = useState(EMPTY_BANKING)

  const [identityKey] = useState(() => crypto.randomUUID())

  const isLastStage = stageIndex === STAGE_ORDER.length - 1
  const activeStage = STAGE_ORDER[stageIndex]

  const goToStage = (index: number) => {
    setStageIndex(index)
    router.replace(`/dashboard/kyc/verify?stage=${index + 1}`)
  }

  const handleNext = async () => {
    setError(null)
    setSubmitting(true)
    try {
      if (stageIndex === 0) await submitPersonalInfo(personal)
      if (stageIndex === 1) await submitContactInfo(contact)
      if (stageIndex === 2) await submitIdentityVerification(identity, identityKey)
      if (stageIndex === 3) await submitBankingInfo(banking)

      toast.success(`${activeStage.title} saved`, {
        description: isLastStage
          ? "That's every stage — we'll review your submission shortly."
          : 'Moved on to the next stage.',
      })

      if (isLastStage) {
        router.push('/dashboard/kyc')
      } else {
        goToStage(stageIndex + 1)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong submitting this stage. Try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-5 pb-10">

        {/* ── Header ── */}
        <div>
          <Link
            href="/dashboard/kyc"
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-content/40 transition-colors hover:text-content/70"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Verification overview
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Complete your verification
          </h1>
          <p className="mt-1 text-sm text-content/50">
            One stage at a time. Your details are saved as you go.
          </p>
        </div>

        {/* ── Stepper + form card ── */}
        <div className="overflow-hidden rounded-[24px] border border-content/10 bg-surface shadow-[0_18px_45px_-35px_rgba(11,23,18,0.55)]">

          <div className="border-b border-content/10 px-5 py-5 sm:px-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8892B]">
                Stage {String(stageIndex + 1).padStart(2, '0')} of {String(STAGE_ORDER.length).padStart(2, '0')}
              </p>
              <span className="text-[11px] text-content/35">{activeStage.title}</span>
            </div>

            <ol className="grid grid-cols-4">
              {STAGE_ORDER.map((stage, index) => {
                const isComplete = index < stageIndex
                const isActive = index === stageIndex

                return (
                  <li key={stage.step} className="relative">
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute left-0 top-5 h-px w-1/2 -translate-y-1/2 transition-colors',
                          index <= stageIndex ? 'bg-[#0E3B2E] dark:bg-[#7FBF9C]' : 'bg-content/15'
                        )}
                      />
                    )}
                    {index < STAGE_ORDER.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute right-0 top-5 h-px w-1/2 -translate-y-1/2 transition-colors',
                          index < stageIndex ? 'bg-[#0E3B2E] dark:bg-[#7FBF9C]' : 'bg-content/15'
                        )}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => goToStage(index)}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`${stage.title}${isComplete ? ' (completed)' : ''}`}
                      className="relative z-10 flex w-full flex-col items-center gap-2 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/30 dark:focus-visible:ring-[#7FBF9C]/40"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition-all',
                          isComplete
                            ? 'border-[#0E3B2E] bg-[#0E3B2E] text-white dark:border-[#7FBF9C] dark:bg-[#7FBF9C] dark:text-[#0B1712]'
                            : isActive
                              ? 'border-[#B8892B] bg-[#B8892B] text-[#0B1712] shadow-[0_0_0_4px_rgba(184,137,43,0.15)]'
                              : 'border-content/15 bg-surface text-content/35'
                        )}
                      >
                        {isComplete ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
                      </span>
                      <span
                        className={cn(
                          'max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.08em]',
                          isActive
                            ? 'text-content'
                            : isComplete
                              ? 'text-content/60'
                              : 'text-content/35'
                        )}
                      >
                        {STAGE_SHORT[index]}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="px-5 py-6 sm:px-7">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold tracking-tight text-content">
                {activeStage.title}
              </h2>
              <p className="mt-0.5 text-xs text-content/45">
                {stageIndex === 0 &&
                  'Use your name exactly as it appears on your government ID.'}
                {stageIndex === 1 &&
                  'Your current residential address and an emergency contact.'}
                {stageIndex === 2 &&
                  'Upload a clear ID photo, a selfie, and a short liveness video.'}
                {stageIndex === 3 &&
                  'The bank account where contributions and payouts should land.'}
              </p>
            </div>

            {stageIndex === 0 && <PersonalProfileForm value={personal} onChange={setPersonal} />}
            {stageIndex === 1 && <ContactAddressForm value={contact} onChange={setContact} />}
            {stageIndex === 2 && <IdentityVerificationForm value={identity} onChange={setIdentity} />}
            {stageIndex === 3 && <BankingInfoForm value={banking} onChange={setBanking} />}

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3 text-sm leading-relaxed text-red-600 dark:text-red-400"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-content/10 pt-5">
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-xl border-content/15 px-4 text-content/65 hover:bg-content/[0.04] hover:text-content"
                onClick={() => goToStage(stageIndex - 1)}
                disabled={stageIndex === 0 || submitting}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {submitting && (
                  <span className="hidden items-center gap-1.5 text-xs text-content/40 sm:flex">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </span>
                )}
                <Button
                  size="sm"
                  className="h-10 gap-1.5 rounded-xl bg-[#0E3B2E] px-5 text-sm font-semibold text-white hover:bg-[#0B1712] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#9ACFAC]"
                  onClick={handleNext}
                  disabled={submitting}
                >
                  {submitting ? (
                    'Saving…'
                  ) : isLastStage ? (
                    <>
                      Submit for review
                      <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Save &amp; continue
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-content/35">
          <ShieldCheck className="h-3.5 w-3.5" />
          Encrypted at rest and visible only to your cooperative&apos;s reviewers.
        </p>
      </div>
    </DashboardLayout>
  )
}

export default function KYCVerifyPage() {
  return (
    <Suspense fallback={null}>
      <KYCVerifyContent />
    </Suspense>
  )
}
