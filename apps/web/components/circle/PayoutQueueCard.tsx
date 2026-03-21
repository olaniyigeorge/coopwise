"use client";

import React from "react";
import { Trophy, Clock, ChevronRight } from "lucide-react";
import { CircleMember } from "@/lib/circle-service";

interface PayoutQueueCardProps {
  members: CircleMember[];
  /** 1-based position of the current user in the rotation */
  yourPosition: number | null;
  nextPayoutDate: string | null;
  currentRound: number;
  totalRounds: number;
  currency: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
  USD: "$",
  USDC: "$",
};

export function PayoutQueueCard({
  members,
  yourPosition,
  nextPayoutDate,
  currentRound,
  totalRounds,
  currency,
}: PayoutQueueCardProps) {
  const currSymbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sortedMembers = [...members].sort(
    (a, b) => a.queue_position - b.queue_position
  );

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Payout queue
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Round {currentRound} of {totalRounds}
          </p>
        </div>

        {/* Next payout */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5" />
            Next payout
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(nextPayoutDate)}
          </p>
        </div>
      </div>

      {/* Your position callout */}
      {yourPosition !== null && (
        <div className="mx-4 mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-medium">Your turn</p>
            <p className="text-sm font-semibold text-foreground">
              Position #{yourPosition} in the queue
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary" />
        </div>
      )}

      {/* Queue list */}
      <ul className="px-4 py-3 space-y-2">
        {sortedMembers.map((member, idx) => {
          const isNext = idx === currentRound - 1;
          const isPaid = idx < currentRound - 1;
          const isYours =
            yourPosition !== null && member.queue_position === yourPosition;

          return (
            <li
              key={member.user_id || idx}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm border ${
                isNext
                  ? "border-amber-300 bg-amber-50"
                  : isPaid
                  ? "border-border bg-muted/30"
                  : "border-transparent bg-transparent"
              } ${isYours ? "ring-1 ring-primary" : ""}`}
            >
              {/* Round number */}
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-700"
                    : isNext
                    ? "bg-amber-100 text-amber-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {member.queue_position}
              </span>

              {/* Name */}
              <span
                className={`flex-1 font-medium truncate ${
                  isPaid ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {member.full_name || "Unknown"}
                {isYours && (
                  <span className="ml-1.5 text-xs font-normal text-primary not-italic no-underline">
                    (you)
                  </span>
                )}
              </span>

              {/* Status badge */}
              {isPaid && (
                <span className="text-xs text-emerald-600 font-medium">
                  Paid out
                </span>
              )}
              {isNext && (
                <span className="text-xs text-amber-700 font-semibold">
                  Next ↑
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
        Rotation is recorded immutably on the Flow blockchain.
      </div>
    </div>
  );
}
