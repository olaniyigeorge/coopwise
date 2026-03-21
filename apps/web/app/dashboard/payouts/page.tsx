"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { useMyPayouts, PayoutStatus } from "@/hooks/useMyPayouts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Lock,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
  USD: "$",
};

function formatAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: PayoutStatus;
}

const STATUS_CONFIG: Record<
  PayoutStatus,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  complete: {
    label: "Sent",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    classes: "bg-emerald-100 text-emerald-700",
  },
  processing: {
    label: "Transferring",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    classes: "bg-blue-100 text-blue-700",
  },
  pending: {
    label: "Processing",
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: "bg-amber-100 text-amber-700",
  },
  failed: {
    label: "Failed",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    classes: "bg-red-100 text-red-700",
  },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const { label, icon, classes } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${classes}`}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PayoutSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-16" />
          </div>
          <div className="h-7 bg-muted rounded animate-pulse w-1/2" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const { payouts, isLoading, error, refetch } = useMyPayouts();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My payouts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your personal payout history — only visible to you.
            </p>
          </div>
          <button
            onClick={refetch}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy note */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-2.5 text-sm text-blue-800">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <p>
            Payout amounts are{" "}
            <strong>visible only to you</strong>. Other circle members see only
            who was paid — never how much. Amounts are stored AES-256 encrypted
            at rest.
          </p>
        </div>

        {/* Content */}
        {isLoading && <PayoutSkeleton />}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={refetch}
              className="ml-2 underline text-primary"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && payouts.length === 0 && (
          <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
            No payouts yet. When it&apos;s your turn in a circle&apos;s
            rotation, your payout will appear here.
          </div>
        )}

        {!isLoading && !error && payouts.length > 0 && (
          <ul className="space-y-3">
            {payouts.map((payout, idx) => (
              <li
                key={`${payout.circle_name}-${payout.round}-${idx}`}
                className="rounded-xl border border-border bg-white p-4 space-y-3"
              >
                {/* Top row — circle + round + status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {payout.circle_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Round {payout.round}
                    </p>
                  </div>
                  <StatusBadge status={payout.status} />
                </div>

                {/* Amount — the payoff */}
                {payout.amount_local > 0 && (
                  <p className="text-3xl font-extrabold text-foreground">
                    {formatAmount(payout.amount_local, payout.currency)}
                  </p>
                )}

                {/* Transfer date */}
                {payout.transferred_at && (
                  <p className="text-xs text-muted-foreground">
                    Transferred on {formatDate(payout.transferred_at)}
                  </p>
                )}

                {/* On-chain verify link */}
                {payout.explorer_url && (
                  <a
                    href={payout.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Verify on-chain (encrypted)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <p className="text-[11px] text-center text-muted-foreground">
          Amounts encrypted on-chain by Zama FHE · Stored encrypted in Postgres
          (AES-256) · Visible only to you
        </p>
      </div>
    </DashboardLayout>
  );
}
