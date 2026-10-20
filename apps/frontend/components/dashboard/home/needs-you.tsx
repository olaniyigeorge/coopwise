'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Mail, ShieldCheck, UserCheck, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionQueueProps {
  isKycVerified?: boolean
  pendingContributionsCount: number
  invitationsCount: number
}

export default function ActionQueue({
  isKycVerified,
  pendingContributionsCount,
  invitationsCount,
}: ActionQueueProps) {
  const needsAction =
    isKycVerified === false ||
    pendingContributionsCount > 0 ||
    invitationsCount > 0

  return (
    <section className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold tracking-tight text-content">
          Action queue
        </h2>
        {needsAction && (
          <span className="rounded-full bg-[#F1E1B7] px-2.5 py-1 text-[10px] font-semibold text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]">
            Action required
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {isKycVerified === false && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] p-3.5 dark:border-[#5A4A22] dark:bg-[#2E2818]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-content/70 dark:bg-white/10">
                <UserCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content">
                  Verify identity (KYC)
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-content/50">
                  Unlocks group governance and payouts
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/kyc"
              className="shrink-0 rounded-full bg-[#E8BC63] px-4 py-1.5 text-xs font-bold text-[#3A2A08] transition-colors hover:bg-[#DFB150]"
            >
              Verify
            </Link>
          </div>
        )}

        {pendingContributionsCount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#CFE6D6] bg-[#EFF7F1] p-3.5 dark:border-[#2C4A39] dark:bg-[#17281F]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#17603F] dark:bg-white/10 dark:text-[#B7E3C3]">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content">Contribution due</p>
                <p className="mt-0.5 text-[11px] leading-snug text-content/50">
                  {pendingContributionsCount} round payment
                  {pendingContributionsCount === 1 ? '' : 's'} awaiting fulfilment
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/contributions"
              className="shrink-0 rounded-full bg-[#0E3B2E] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
            >
              Pay now
            </Link>
          </div>
        )}

        {invitationsCount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#CBDDF7] bg-[#EEF4FD] p-3.5 dark:border-[#2B4366] dark:bg-[#182335]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#24508F] dark:bg-white/10 dark:text-[#A9C5F0]">
                <Mail className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content">Pending invite</p>
                <p className="mt-0.5 text-[11px] leading-snug text-content/50">
                  {invitationsCount} cooperative invitation
                  {invitationsCount === 1 ? '' : 's'} to review
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/join-group"
              className="shrink-0 rounded-full border border-[#24508F]/20 bg-white px-4 py-1.5 text-xs font-bold text-[#24508F] transition-colors hover:bg-[#24508F]/5 dark:border-[#A9C5F0]/30 dark:bg-transparent dark:text-[#A9C5F0] dark:hover:bg-[#A9C5F0]/10"
            >
              Review
            </Link>
          </div>
        )}

        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-2xl border border-dashed border-content/10 p-3.5',
            needsAction ? 'bg-transparent' : 'bg-surface'
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-content/5 text-content/55">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-content/75">
                Governance &amp; decisions
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-content/40">
                Collective voting and proposals
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] italic text-content/35">
            Coming soon
          </span>
        </div>
      </div>

      {!needsAction && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-content/40">
          <Vote className="h-3.5 w-3.5" />
          Nothing needs your attention right now.
        </p>
      )}
    </section>
  )
}
