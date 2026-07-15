"use client"

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
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

  const isLastStage = stageIndex === STAGE_ORDER.length - 1

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
      if (stageIndex === 2) await submitIdentityVerification(identity)
      if (stageIndex === 3) await submitBankingInfo(banking)

      if (isLastStage) {
        router.push('/dashboard/kyc')
      } else {
        goToStage(stageIndex + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting this stage. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeStage = STAGE_ORDER[stageIndex]

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-8">

        {/* ── Stage pills ── */}
        <div className="flex items-center gap-2">
          {STAGE_ORDER.map((stage, index) => {
            const isActive = index === stageIndex
            const isComplete = index < stageIndex
            return (
              <button
                key={stage.step}
                onClick={() => goToStage(index)}
                className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : isComplete
                    ? 'bg-primary/10 text-primary'
                    : 'bg-white border border-brand-ink/10 text-brand-ink/45'
                }`}
              >
                {isComplete ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
                <span className="truncate">{stage.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Form card ── */}
        <div className="bg-white rounded-2xl border border-brand-ink/10 shadow-sm p-6">
          <h1 className="font-display text-xl font-bold text-brand-ink tracking-tight mb-6">
            {activeStage.title}
          </h1>

          {stageIndex === 0 && <PersonalProfileForm value={personal} onChange={setPersonal} />}
          {stageIndex === 1 && <ContactAddressForm value={contact} onChange={setContact} />}
          {stageIndex === 2 && <IdentityVerificationForm value={identity} onChange={setIdentity} />}
          {stageIndex === 3 && <BankingInfoForm value={banking} onChange={setBanking} />}

          {error && (
            <p className="mt-5 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-brand-ink/15 text-brand-ink/70"
              onClick={() => goToStage(stageIndex - 1)}
              disabled={stageIndex === 0 || submitting}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : isLastStage ? 'Submit' : 'Next'}
              {!submitting && !isLastStage && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

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