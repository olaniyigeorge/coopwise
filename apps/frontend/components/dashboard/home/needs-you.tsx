'use client'

import React from 'react'
import { AlertCircle, CheckCircle2, UserCheck, Vote, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface NeedsYouProps {
  isKycVerified?: boolean
  pendingContributionsCount: number
  invitationsCount: number
}

export default function NeedsYou({
  isKycVerified,
  pendingContributionsCount,
  invitationsCount,
}: NeedsYouProps) {
  const hasActions = !isKycVerified || pendingContributionsCount > 0 || invitationsCount > 0

  return (
    <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-brand-gold" />
          <h2 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">Action Queue (Needs You)</h2>
        </div>
        {hasActions && (
          <span className="text-[10px] font-bold bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full">
            Action Required
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {/* KYC Verification Gate */}
        {!isKycVerified && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-brand-ink">Verify Identity (KYC)</p>
                <p className="text-brand-ink/60">Unlock group governance and payouts.</p>
              </div>
            </div>
            <Link href="/dashboard/kyc">
              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                Verify
              </Button>
            </Link>
          </div>
        )}

        {/* Pending Round Contribution */}
        {pendingContributionsCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-brand-ink">Contribution Due</p>
                <p className="text-brand-ink/60">{pendingContributionsCount} round payment awaiting fulfillment.</p>
              </div>
            </div>
            <Link href="/dashboard/groups">
              <Button size="sm" className="h-7 text-xs">
                Pay Now
              </Button>
            </Link>
          </div>
        )}

        {/* Pending Invitations */}
        {invitationsCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-brand-ink">Pending Group Invite</p>
                <p className="text-brand-ink/60">You have {invitationsCount} invitation(s) pending.</p>
              </div>
            </div>
            <Link href="/dashboard/join-group">
              <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700">
                Review
              </Button>
            </Link>
          </div>
        )}

        {/* Pending Votes / Governance - Graceful Coming Soon */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-brand-paper border border-brand-ink/5 text-xs opacity-75">
          <div className="flex items-center gap-2.5">
            <Vote className="w-4 h-4 text-brand-ink/40 shrink-0" />
            <div>
              <p className="font-medium text-brand-ink/70">Cooperative Governance & Decisions</p>
              <p className="text-brand-ink/40">Collective voting and proposals.</p>
            </div>
          </div>
          <span className="text-[10px] text-brand-ink/40 italic">// TODO(backend): coming soon</span>
        </div>
      </div>
    </div>
  )
}