'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, Eye, EyeOff, Plus, ShieldCheck, Target, Clock } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import ComingSoonButton from '@/components/coming-soon-button'

interface WalletHeroProps {
  localBalance: number
  stableBalance: number
  localCurrency: string
  trustScore: number
  kycVerified?: boolean
  /** Active shared goals across the member's cooperatives. */
  activeGoalsCount: number
  /** Cooperatives the member currently sits in. */
  seatsTaken: number
}

type CurrencyTab = 'local' | 'stable'

function TrustCircle({
  trustScore,
  kycVerified,
  activeGoalsCount,
  seatsTaken,
}: Pick<
  WalletHeroProps,
  'trustScore' | 'kycVerified' | 'activeGoalsCount' | 'seatsTaken'
>) {
  return (
    <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1B4B3D] via-[#123528] to-[#0A241C] p-5 text-white">
      {/* Decorative orbit rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/2 h-[250px] w-[250px] -translate-y-1/2"
      >
        <div className="absolute inset-0 rounded-full border border-dashed border-white/15" />
        <div className="absolute inset-8 rounded-full border border-white/10" />
        <div className="absolute inset-16 rounded-full border border-white/[0.08]" />
        <span className="absolute left-[18%] top-[12%] h-2 w-2 rounded-full bg-[#7FBF9C]" />
        <span className="absolute right-[6%] top-[8%] h-2 w-2 rounded-full bg-[#B7E3C3]" />
        <span className="absolute bottom-[13%] right-[13%] h-2.5 w-2.5 rounded-full bg-[#7FBF9C]" />
        <span className="absolute bottom-[10%] left-[8%] h-2.5 w-2.5 rounded-full bg-white/80" />
      </div>

      <div className="relative z-10 flex items-center">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium',
            kycVerified === true
              ? 'border-[#7FBF9C]/30 bg-[#7FBF9C]/10 text-[#B7E3C3]'
              : 'border-white/15 bg-white/[0.06] text-white/80'
          )}
        >
          {kycVerified === true ? (
            <>
              <ShieldCheck className="h-3 w-3" />
              KYC verified
            </>
          ) : kycVerified === false ? (
            <>
              <Clock className="h-3 w-3" />
              KYC pending
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              Checking KYC…
            </>
          )}
        </span>
      </div>

      {/* Score sits inside the inner ring */}
      <div className="relative z-10 mx-auto my-3 flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[1px]">
        <span className="font-display text-3xl font-bold leading-none">
          {trustScore}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-white/55">
          of 100 trust
        </span>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Your trust circle</p>
          <p className="mt-0.5 truncate text-[11px] text-white/60">
            {seatsTaken} {seatsTaken === 1 ? 'seat' : 'seats'} taken · open seats wait
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/85">
          <Target className="h-3.5 w-3.5" />
          {activeGoalsCount} shared {activeGoalsCount === 1 ? 'goal' : 'goals'} active
        </span>
      </div>
    </div>
  )
}

export default function WalletHero({
  localBalance,
  stableBalance,
  localCurrency,
  trustScore,
  kycVerified,
  activeGoalsCount,
  seatsTaken,
}: WalletHeroProps) {
  const [tab, setTab] = useState<CurrencyTab>('local')
  const [hidden, setHidden] = useState(false)

  const primaryValue =
    tab === 'local' ? formatCurrency(localBalance || 0, 2) : `$${(stableBalance || 0).toFixed(2)}`
  const secondaryValue =
    tab === 'local'
      ? `≈ ${(stableBalance || 0).toFixed(2)} USDC`
      : `≈ ${formatCurrency(localBalance || 0, 2)}`

  return (
    <section className="grid grid-cols-1 gap-4 rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] lg:grid-cols-[1.45fr_1fr] lg:p-6">
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('local')}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                tab === 'local'
                  ? 'bg-[#0E3B2E] text-white dark:bg-[#7FBF9C] dark:text-[#0B1712]'
                  : 'border border-content/10 text-content/70 hover:bg-content/5'
              )}
            >
              {localCurrency || 'NGN'}
            </button>
            <button
              type="button"
              onClick={() => setTab('stable')}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                tab === 'stable'
                  ? 'bg-[#0E3B2E] text-white dark:bg-[#7FBF9C] dark:text-[#0B1712]'
                  : 'border border-content/10 text-content/70 hover:bg-content/5'
              )}
            >
              USDC
            </button>
            <Link
              href="/dashboard/wallet/fund"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-content/10 text-content/60 transition-colors hover:bg-content/5 hover:text-content"
              aria-label="Add a currency"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-content/45">
            Wallet balance
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-display text-4xl font-bold tracking-tight text-content sm:text-5xl">
              {hidden ? '••••••' : primaryValue}
            </span>
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-content/45 transition-colors hover:bg-content/5 hover:text-content"
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-content/45">
            {hidden ? '••••••' : secondaryValue}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/wallet/fund"
            className="inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
          >
            <Plus className="h-4 w-4" />
            Add Money
          </Link>
          <ComingSoonButton
            title="Withdrawals coming soon"
            description="Bank and stable-coin withdrawals are being wired up. You'll be able to cash out from this wallet soon."
            className="inline-flex h-auto items-center gap-2 rounded-full bg-[#1F7A54] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#196546]"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Withdraw
          </ComingSoonButton>
          <Link
            href="/dashboard/contributions/make"
            className="inline-flex items-center gap-2 rounded-full border border-content/15 px-5 py-2.5 text-sm font-semibold text-content transition-colors hover:border-content/30 hover:bg-content/[0.03]"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Contribute
          </Link>
        </div>
      </div>

      <TrustCircle
        trustScore={trustScore}
        kycVerified={kycVerified}
        activeGoalsCount={activeGoalsCount}
        seatsTaken={seatsTaken}
      />
    </section>
  )
}
