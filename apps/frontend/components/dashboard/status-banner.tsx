"use client"

import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'

interface StatusBannerProps {
  // Mirrors the real `is_kyc_verified` field the backend will send on the
  // user object. Left optional on purpose: until that field is actually
  // wired up, this stays `undefined` and the banner renders nothing rather
  // than guessing at a user's KYC state.
  isKycVerified?: boolean
}

export default function StatusBanner({ isKycVerified }: StatusBannerProps) {
  console.log(`\n\n${isKycVerified}\n\n`)
  if (isKycVerified !== false) return null

  return (
    <div className="rounded-xl border border-[#B8892B]/30 bg-[#B8892B]/5 px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
      <div className="w-8 h-8 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-brand-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-ink">Identity verification is still pending.</p>
        <p className="text-xs text-brand-ink/60">
          It only takes a couple of minutes, and it's required before you can send or receive payouts.
        </p>
      </div>
      <Link
        href="/dashboard/kyc"
        className="flex items-center gap-1 text-sm font-semibold text-brand-gold hover:text-brand-gold/80 transition-colors flex-shrink-0 group"
      >
        Complete Verification
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}