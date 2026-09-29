"use client"

import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'

interface StatusBannerProps {
  isKycVerified?: boolean
}

export default function StatusBanner({ isKycVerified }: StatusBannerProps) {

  if (isKycVerified !== false) return null

  return (
    <div className="rounded-xl border border-[#B8892B]/30 bg-[#B8892B]/5 px-4 py-2 flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-brand-gold flex-shrink-0" />
      <p
        className="flex-1 min-w-0 truncate text-sm text-brand-ink"
        title="It only takes a couple of minutes, and it's required before you can send or receive payouts."
      >
        Verify your identity to send or receive payouts.
      </p>
      <Link
        href="/dashboard/kyc"
        className="flex items-center gap-1 text-sm font-semibold text-brand-gold hover:text-brand-gold/80 transition-colors flex-shrink-0 group"
      >
        Verify
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}