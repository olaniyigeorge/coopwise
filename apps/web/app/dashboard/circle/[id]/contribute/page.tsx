"use client";

import React from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout";
import { ContributePanel } from "@/components/circle/ContributePanel";
import { useCircle } from "@/hooks/useCircle";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
  USD: "$",
  USDC: "$",
};

function formatAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function ContributePage() {
  const params = useParams();
  const circleId = params.id as string;

  const { circle, isLoading, error } = useCircle(circleId);

  const circleDetailUrl = `/dashboard/circle/${circleId}`;

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href={circleDetailUrl}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to circle
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Contribute this round
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your payment is secured by Zama FHE encryption and confirmed on the
            Flow blockchain.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && circle && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <ContributePanel
              circleId={parseInt(circleId, 10)}
              circleName={circle.name}
              displayAmount={formatAmount(
                circle.weekly_amount_local,
                circle.currency
              )}
              returnUrl={circleDetailUrl}
            />
          </div>
        )}

        {/* How it works — collapsible explainer */}
        <details className="mt-6 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            How does this work?
          </summary>
          <ol className="mt-3 space-y-2 text-muted-foreground list-decimal list-inside">
            <li>
              CoopWise asks the Zama relayer to encrypt your {" "}
              {circle
                ? formatAmount(circle.weekly_amount_local, circle.currency)
                : "contribution"}{" "}
              into an unreadable ciphertext.
            </li>
            <li>
              Your device biometrics (Face ID / fingerprint) sign the encrypted
              transaction — no password or seed phrase.
            </li>
            <li>
              The encrypted transaction goes to the Flow blockchain. CoopWise
              pays the gas — you pay nothing extra.
            </li>
            <li>
              A ✓ appears next to your name. Other members see only ✓, never
              the amount.
            </li>
          </ol>
        </details>
      </div>
    </DashboardLayout>
  );
}
