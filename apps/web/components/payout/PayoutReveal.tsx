"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, PartyPopper, Loader2, AlertCircle } from "lucide-react";
import { Circle } from "@/lib/circle-service";
import { useMyPayouts, MyPayout, PayoutStatus } from "@/hooks/useMyPayouts";
import useAuthStore from "@/lib/stores/auth-store";
import Link from "next/link";

interface PayoutRevealProps {
  circle: Circle;
}

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

const STATUS_CONFIG: Record<
  PayoutStatus,
  { label: string; colour: string }
> = {
  pending: {
    label: "Processing your payout…",
    colour: "text-amber-600",
  },
  processing: {
    label: "Bank transfer in progress (30–60 min)",
    colour: "text-blue-600",
  },
  complete: {
    label: "Sent to your bank account!",
    colour: "text-emerald-600",
  },
  failed: {
    label: "Transfer failed — support has been notified.",
    colour: "text-red-600",
  },
};

/**
 * PayoutReveal — shown ONLY to the rotation winner on the circle detail page.
 *
 * Conditions for rendering:
 *   circle.current_winner === user.flow_address
 *
 * Amounts are visible only here (personal view).
 * Other members see only "Round X — complete" — no amount.
 */
export function PayoutReveal({ circle }: PayoutRevealProps) {
  const { user } = useAuthStore();
  const { payouts, isLoading, refetch } = useMyPayouts();
  const [hasPulled, setHasPulled] = useState(false);

  // Only render if it's this user's turn
  const isWinner =
    user?.flow_address &&
    circle.current_winner &&
    user.flow_address === circle.current_winner;

  // Poll every 30 s while status is pending/processing
  useEffect(() => {
    if (!isWinner) return;
    setHasPulled(true);
    const interval = setInterval(() => {
      const payout = payouts.find(
        (p) => p.circle_name === circle.name && p.round === circle.current_round
      );
      if (payout?.status === "complete" || payout?.status === "failed") {
        clearInterval(interval);
      } else {
        refetch();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [isWinner, payouts, circle.name, circle.current_round, refetch]);

  if (!isWinner) return null;

  const thisPayout: MyPayout | undefined = payouts.find(
    (p) => p.circle_name === circle.name && p.round === circle.current_round
  );

  const statusCfg = thisPayout
    ? STATUS_CONFIG[thisPayout.status]
    : STATUS_CONFIG["pending"];

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden shadow-md">
      {/* Banner */}
      <div className="bg-amber-400 px-5 py-3 flex items-center gap-2">
        <PartyPopper className="w-5 h-5 text-white" />
        <p className="text-white font-bold text-sm tracking-wide">
          It&apos;s your turn!
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {isLoading && !hasPulled ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your payout details…
          </div>
        ) : thisPayout ? (
          <>
            {/* Amount — only visible to the winner */}
            {(thisPayout.status === "processing" ||
              thisPayout.status === "complete") && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Your payout
                </p>
                <p className="text-4xl font-extrabold text-foreground">
                  {formatAmount(thisPayout.amount_local, thisPayout.currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Only you can see this amount.
                </p>
              </div>
            )}

            {/* Status */}
            <p className={`text-sm font-semibold ${statusCfg.colour}`}>
              {thisPayout.status === "failed" ? (
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {statusCfg.label}
                </span>
              ) : thisPayout.status === "pending" ||
                thisPayout.status === "processing" ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {statusCfg.label}
                </span>
              ) : (
                statusCfg.label
              )}
            </p>

            {/* On-chain verify */}
            <a
              href={thisPayout.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Verify payout on-chain (encrypted)
              <ExternalLink className="w-3 h-3" />
            </a>
          </>
        ) : (
          /* Backend is processing — payout record not created yet */
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing your payout…
            </div>
            <p className="text-xs text-muted-foreground">
              The Zama oracle is decrypting the circle pool. Your local currency
              amount will appear here in a few minutes.
            </p>
          </div>
        )}

        {/* Link to full payout history */}
        <Link
          href="/dashboard/payouts"
          className="block text-xs text-primary hover:underline"
        >
          View all my payouts →
        </Link>
      </div>
    </div>
  );
}
