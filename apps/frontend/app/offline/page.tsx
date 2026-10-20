import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline · CoopWise",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-paper px-5 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(14,59,46,0.08),transparent_50%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-gold/30 bg-white text-brand-gold shadow-sm">
          <CloudOff className="h-7 w-7" strokeWidth={1.7} />
        </span>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold">
          No connection
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-ink">
          You&apos;re offline
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-brand-ink/55">
          Your ledger is safe. Reconnect to load fresh contributions, payouts
          and member updates.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <a href="/dashboard">
            <Button className="h-11 w-full rounded-xl">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </a>
          <Link
            href="/"
            className="text-xs font-semibold text-brand-ink/45 transition-colors hover:text-brand-teal"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
