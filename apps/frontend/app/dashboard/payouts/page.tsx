"use client"

import React, { useCallback, useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard/layout"
import PayoutService, {
  MyPayout,
  PayoutStatus,
  UpcomingPayout,
} from "@/services/payout-service"
import { getApiErrorDetail } from "@/lib/api-error"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Banknote,
} from "lucide-react"

const STATUS: Record<
  PayoutStatus,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Sent",
    classes: "bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  processing: {
    label: "Transferring",
    classes: "bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  pending: {
    label: "Processing",
    classes: "bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  failed: {
    label: "Failed",
    classes: "bg-[#FBE2D6] text-[#B4451F] dark:bg-[#3B2820] dark:text-[#F3B79E]",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
}

const STRATEGY_LABEL: Record<string, string> = {
  rotating: "Rotating",
  equal: "Equal split",
  priority: "Priority",
}

function errorText(err: unknown, fallback: string) {
  const detail = getApiErrorDetail(err)
  if (typeof detail === "string" && detail) return detail
  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function formatWhen(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function turnCopy(item: UpcomingPayout) {
  if (item.inflight) return "A payout for this cooperative is already transferring."
  if (item.trigger === "automatic" && item.strategy === "equal") {
    return item.funded
      ? "This round is funded. Everyone’s share is sent automatically."
      : "Everyone receives an equal share automatically once the round is fully contributed."
  }
  if (item.trigger === "automatic" && item.is_my_turn) {
    return item.funded
      ? "This round is funded. Your payout is sent automatically."
      : "It’s your turn. You’ll be paid automatically once this round is fully contributed."
  }
  if (item.trigger === "automatic") {
    const who = item.next_recipient_name || "the next member"
    return `Next payout goes to ${who} when the round is fully contributed.`
  }
  if (item.can_trigger) return "This cooperative pays out when an admin sends it."
  return "An admin sends this payout once the round is ready."
}

export default function PayoutsPage() {
  const [history, setHistory] = useState<MyPayout[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mine, turns] = await Promise.all([
        PayoutService.listMine(),
        PayoutService.listUpcoming(),
      ])
      setHistory(Array.isArray(mine) ? mine : [])
      setUpcoming(Array.isArray(turns) ? turns : [])
    } catch (err) {
      setError(errorText(err, "Could not load payouts."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sendPayout = async (groupId: string) => {
    try {
      setSendingId(groupId)
      await PayoutService.trigger(groupId)
      toast.success("Payout sent")
      await load()
    } catch (err) {
      toast.error(errorText(err, "Could not send this payout."))
    } finally {
      setSendingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-4 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-content/45">
              Wallet
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Payouts
            </h1>
            <p className="mt-1.5 text-sm text-content/55">
              Your turn in each cooperative, and the payouts that have been sent to you.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-content/45 transition-colors hover:bg-content/5 hover:text-content"
            aria-label="Refresh payouts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-[24px] bg-surface" />
            <div className="h-28 animate-pulse rounded-[24px] bg-surface" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-[#F3C6C6] bg-[#FDEDED] px-4 py-3 text-sm text-[#8F2D2D] dark:border-[#5A2A2A] dark:bg-[#2E1717] dark:text-[#F0A9A9]">
            {error}
            <button type="button" onClick={load} className="ml-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <section className="space-y-3">
            <h2 className="font-display text-base font-bold tracking-tight text-content">
              Your turn
            </h2>
            {upcoming.length === 0 ? (
              <div className="rounded-[24px] bg-surface px-5 py-8 text-center shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                  <Banknote className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-content">No active cooperatives</p>
                <p className="mt-1 text-sm text-content/50">
                  Payouts appear here once you belong to an active cooperative.
                </p>
              </div>
            ) : (
              upcoming.map((item) => (
                <article
                  key={item.group_id}
                  className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold tracking-tight text-content">
                        {item.group_name}
                      </p>
                      <p className="mt-0.5 text-xs text-content/45">
                        Round {item.round_number} · {STRATEGY_LABEL[item.strategy] ?? item.strategy}
                        {item.trigger === "automatic" ? " · Automatic" : " · Admin sends it"}
                      </p>
                    </div>
                    {item.is_my_turn && (
                      <span className="shrink-0 rounded-full bg-[#DFF0E4] px-2.5 py-1 text-[11px] font-semibold text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                        Your turn
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-content/60">{turnCopy(item)}</p>
                  {item.payable_amount != null && (
                    <div className="mt-2">
                      <p className="font-display text-2xl font-bold tracking-tight text-content">
                        {formatCurrency(item.payable_amount)}
                      </p>
                      <p className="text-[11px] text-content/40">
                        In the cooperative · contributions in, payouts out
                      </p>
                    </div>
                  )}
                  {item.can_trigger && (
                    <button
                      type="button"
                      onClick={() => sendPayout(item.group_id)}
                      disabled={sendingId === item.group_id}
                      className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0E3B2E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] disabled:opacity-60"
                    >
                      {sendingId === item.group_id && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send payout
                    </button>
                  )}
                </article>
              ))
            )}
          </section>
        )}

        {!loading && !error && (
          <section className="space-y-3">
            <h2 className="font-display text-base font-bold tracking-tight text-content">
              Received
            </h2>
            {history.length === 0 ? (
              <p className="rounded-[24px] bg-surface px-5 py-8 text-center text-sm text-content/50 shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
                Nothing has been sent to you yet.
              </p>
            ) : (
              history.map((payout) => {
                const status = STATUS[payout.status] ?? STATUS.pending
                const when = formatWhen(payout.completed_at || payout.created_at)
                return (
                  <article
                    key={payout.id}
                    className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-content">
                          {payout.group_name}
                        </p>
                        <p className="text-xs text-content/45">Round {payout.round_number}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.classes}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-3xl font-bold tracking-tight text-content">
                      {formatCurrency(Number(payout.amount) || 0)}
                    </p>
                    {when && <p className="mt-1 text-xs text-content/40">{when}</p>}
                    {payout.status === "failed" && payout.failure_reason && (
                      <p className="mt-2 text-xs text-[#B4451F] dark:text-[#F3B79E]">
                        {payout.failure_reason}
                      </p>
                    )}
                  </article>
                )
              })
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
