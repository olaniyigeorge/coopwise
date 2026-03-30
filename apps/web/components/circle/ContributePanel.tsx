"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Fingerprint,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Repeat2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useContribution, ContributionStatus } from "@/hooks/useContribution";

interface ContributePanelProps {
  circleId: number | string;
  circleName: string;
  /** Amount formatted for display e.g. "₦5,000" */
  displayAmount: string;
  /** After a successful contribution, redirect here */
  returnUrl?: string;
}

const STATUS_MESSAGES: Record<ContributionStatus, string> = {
  idle: "",
  encrypting: "Encrypting your contribution amount…",
  signing: "Confirm with your fingerprint or face…",
  confirming: "Broadcasting to Flow blockchain…",
  done: "Contribution confirmed!",
  error: "",
};

const STATUS_SUBLABEL: Record<ContributionStatus, string> = {
  idle: "",
  encrypting: "Zama FHE shields your amount so nobody else can read it.",
  signing: "This uses your device biometrics — no password needed.",
  confirming: "Usually takes 5–15 seconds on testnet.",
  done: "A ✓ now appears next to your name. Other members see only ✓, not the amount.",
  error: "",
};

function StatusIcon({ status }: { status: ContributionStatus }) {
  if (status === "done")
    return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
  if (status === "signing")
    return (
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <Fingerprint className="w-7 h-7 text-primary" />
      </div>
    );
  if (status === "encrypting" || status === "confirming")
    return <Loader2 className="w-12 h-12 text-primary animate-spin" />;
  if (status === "error")
    return <AlertCircle className="w-12 h-12 text-destructive" />;
  return null;
}

export function ContributePanel({
  circleId,
  circleName,
  displayAmount,
  returnUrl,
}: ContributePanelProps) {
  const router = useRouter();
  const { contribute, enableAutoPay, status, error, txId, isAutoPay, reset } =
    useContribution(circleId);

  const isActive = ["encrypting", "signing", "confirming"].includes(status);

  const handleContribute = async () => {
    const result = await contribute();
    if (result && returnUrl) {
      // Brief pause so user sees the success state before navigating
      setTimeout(() => router.push(returnUrl), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Amount summary */}
      <div className="rounded-xl bg-muted/60 border border-border px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Contributing to</p>
          <p className="font-semibold text-foreground">{circleName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="text-2xl font-extrabold text-foreground">{displayAmount}</p>
        </div>
      </div>

      {/* Privacy badge */}
      <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <span className="shrink-0 mt-0.5 text-base">🔒</span>
        <p>
          Your amount is <strong>encrypted before it leaves your device</strong>{" "}
          using Zama FHE. Only ✓ / ✗ is visible on-chain.
        </p>
      </div>

      {/* Active state — progress */}
      {(status !== "idle" && status !== "error") && (
        <div className="flex flex-col items-center gap-3 py-4">
          <StatusIcon status={status} />
          <p className="font-semibold text-center text-foreground">
            {STATUS_MESSAGES[status]}
          </p>
          {STATUS_SUBLABEL[status] && (
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {STATUS_SUBLABEL[status]}
            </p>
          )}
          {status === "done" && txId && (
            <a
              href={`${
                process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet"
                  ? "https://flowscan.io/tx"
                  : "https://testnet.flowscan.io/tx"
              }/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View transaction on Flowscan <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={reset}
            className="mt-1.5 text-xs text-red-600 underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      )}

      {/* Primary CTA */}
      {status === "idle" || status === "error" ? (
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
          onClick={handleContribute}
          disabled={isActive}
        >
          <Fingerprint className="w-5 h-5 mr-2" />
          Contribute {displayAmount}
        </Button>
      ) : status === "done" ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(returnUrl ?? "/dashboard")}
        >
          Back to circle
        </Button>
      ) : (
        <Button className="w-full" disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {STATUS_MESSAGES[status]}
        </Button>
      )}

      {/* Auto-pay toggle — only shown when idle or done */}
      {(status === "idle" || status === "done") && (
        <div className="flex items-start justify-between gap-3 pt-2 border-t border-border">
          <div>
            <Label
              htmlFor="auto-pay"
              className="font-medium flex items-center gap-1.5"
            >
              <Repeat2 className="w-4 h-4 text-muted-foreground" />
              Auto-pay
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically contribute each round — you&apos;ll get a notification.
              A limited session key is registered on your Flow account.
            </p>
          </div>
          <Switch
            id="auto-pay"
            checked={isAutoPay}
            onCheckedChange={(checked) => enableAutoPay(checked)}
          />
        </div>
      )}
    </div>
  );
}
