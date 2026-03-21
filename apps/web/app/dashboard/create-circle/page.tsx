"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { CreateCircleForm } from "@/components/circle/CreateCircleForm";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function CreateCirclePage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Start a circle</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your circle lives on the Flow blockchain — no bank, no middleman.
            Members contribute each round; the pot rotates automatically.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-800">
            <p className="font-medium">Private &amp; trustless</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Contribution amounts are encrypted on-chain using Zama FHE. Only
              ✓ or ✗ statuses are visible to other members.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <CreateCircleForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
