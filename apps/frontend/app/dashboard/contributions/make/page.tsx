"use client"

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, CreditCard, Loader2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import CooperativeService from '@/services/cooperative-service'
import ContributionService from '@/services/contribution-service'
import { getDashboardData } from '@/services/dashboard-service'
import { getApiErrorDetail } from '@/lib/api-error'
import { formatCurrency } from '@/lib/utils'
import type { Cooperative } from '@/types/cooperative'

function LoadingFallback() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg animate-pulse space-y-4">
        <div className="h-8 w-24 rounded-full bg-content/5" />
        <div className="h-16 rounded-2xl bg-content/5" />
        <div className="h-80 rounded-[24px] bg-surface" />
      </div>
    </DashboardLayout>
  )
}

function errorMessage(err: unknown, fallback: string) {
  const detail = getApiErrorDetail(err)
  if (typeof detail === 'string' && detail) return detail
  if (detail && typeof detail === 'object' && typeof detail.message === 'string') {
    return detail.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function MakeContributionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetGroupId = searchParams.get('groupId') ?? ''
  const presetAmount = searchParams.get('amount') ?? ''

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [groupId, setGroupId] = useState(presetGroupId)
  const [amount, setAmount] = useState(presetAmount)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<'wallet' | 'paystack' | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      CooperativeService.listMyCooperatives().catch(() => [] as Cooperative[]),
      getDashboardData().catch(() => null),
    ]).then(([groups, dashboard]) => {
      if (cancelled) return
      const list = Array.isArray(groups) ? groups : []
      setCooperatives(list)
      setGroupId((current) => {
        if (current && list.some((group) => group.id === current)) return current
        const active = list.find((group) => group.status === 'active')
        return active?.id ?? ''
      })
      const balance = dashboard?.summary?.wallet?.local_balance
      setWalletBalance(balance != null ? Number(balance) : null)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selected = cooperatives.find((group) => group.id === groupId) ?? null
  const canPay = selected?.status === 'active'
  const parsedAmount = Number(amount)
  const amountIsValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const busy = paying !== null

  const payFromWallet = async () => {
    if (!selected || !canPay) {
      toast.error('Choose an active cooperative.')
      return
    }
    if (!amountIsValid) {
      toast.error('Enter a valid contribution amount.')
      return
    }
    try {
      setPaying('wallet')
      await ContributionService.contribute({
        group_id: selected.id,
        amount: parsedAmount,
      })
      toast.success('Contribution successful!')
      router.push(`/dashboard/cooperative/${selected.id}`)
    } catch (err) {
      const message = errorMessage(err, 'Failed to process contribution.')
      if (message.toLowerCase().includes('insufficient')) {
        toast.error(message, {
          description: 'Fund your wallet with Paystack to continue.',
          action: {
            label: 'Fund wallet',
            onClick: () => router.push('/dashboard/wallet/fund'),
          },
        })
      } else {
        toast.error(message)
      }
      setPaying(null)
    }
  }

  const payWithPaystack = async () => {
    if (!selected || !canPay) {
      toast.error('Choose an active cooperative.')
      return
    }
    if (!parsedAmount || parsedAmount < 100) {
      toast.error('Enter an amount of at least ₦100.')
      return
    }
    try {
      setPaying('paystack')
      const res = await ContributionService.initiatePaystack({
        group_id: selected.id,
        amount: parsedAmount,
      })
      window.location.href = res.authorization_url
    } catch (err) {
      toast.error(errorMessage(err, 'Could not start payment.'))
      setPaying(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-4 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-content/55 transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-content/45">
            Contributions
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Make a contribution
          </h1>
          <p className="mt-1.5 text-sm text-content/55">
            Choose a cooperative, enter an amount, and pay from your wallet or with Paystack.
          </p>
        </div>

        <div className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-11 animate-pulse rounded-xl bg-content/5" />
              <div className="h-14 animate-pulse rounded-xl bg-content/5" />
              <div className="h-14 animate-pulse rounded-xl bg-content/5" />
            </div>
          ) : cooperatives.length === 0 ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm font-semibold text-content">You are not in a cooperative yet</p>
              <p className="text-sm text-content/50">
                Join or create one before you can contribute.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#0E3B2E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24]"
              >
                Go to dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content/45">
                  Cooperative
                </Label>
                <Select value={groupId || undefined} onValueChange={setGroupId}>
                  <SelectTrigger className="h-11 rounded-xl border-content/15">
                    <SelectValue placeholder="Choose a cooperative" />
                  </SelectTrigger>
                  <SelectContent>
                    {cooperatives.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                        {group.status !== 'active' ? ` · ${group.status}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && !canPay && (
                  <p className="text-[11px] text-[#8A6516] dark:text-[#E8BC63]">
                    Contributions open once this cooperative is active.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contribution-amount"
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content/45"
                >
                  Amount
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-content/35">
                    ₦
                  </span>
                  <Input
                    id="contribution-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 rounded-xl border-content/15 bg-content/[0.03] pl-10 pr-4 font-display text-2xl font-bold tracking-tight md:text-2xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-content/10 bg-content/[0.03] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E]/[0.08] text-[#0E3B2E] dark:bg-[#7FBF9C]/10 dark:text-[#7FBF9C]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-content/45">Wallet balance</p>
                    <p className="truncate text-sm font-semibold tabular-nums">
                      {walletBalance != null ? formatCurrency(walletBalance, 2) : '—'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/wallet/fund"
                  className="shrink-0 rounded-full border border-content/15 px-3 py-1.5 text-xs font-semibold text-content/70 transition-colors hover:bg-content/[0.05] hover:text-content"
                >
                  Fund
                </Link>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={payFromWallet}
                  disabled={busy || !canPay}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paying === 'wallet' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Pay from wallet
                </button>
                <button
                  type="button"
                  onClick={payWithPaystack}
                  disabled={busy || !canPay}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#1F7A54]/40 bg-transparent text-sm font-semibold text-[#1F7A54] transition-colors hover:border-[#1F7A54]/60 hover:bg-[#1F7A54]/5 hover:text-[#0E3B2E] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#7FBF9C]/40 dark:text-[#7FBF9C] dark:hover:bg-[#7FBF9C]/10 dark:hover:text-[#B7E3C3]"
                >
                  {paying === 'paystack' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Pay with Paystack
                </button>
                <p className="text-center text-[11px] text-content/40">
                  Card, bank transfer or USSD
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function MakeContributionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MakeContributionContent />
    </Suspense>
  )
}
