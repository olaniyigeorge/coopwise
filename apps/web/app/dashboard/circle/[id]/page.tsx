"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/layout";
import { MemberStatusGrid } from "@/components/circle/MemberStatusGrid";
import { PayoutQueueCard } from "@/components/circle/PayoutQueueCard";
import { CircleHistory } from "@/components/circle/CircleHistory";
import { PayoutReveal } from "@/components/payout/PayoutReveal";
import { useCircle } from "@/hooks/useCircle";
import useAuthStore from "@/lib/stores/auth-store";
import CircleService from "@/lib/circle-service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ExternalLink,
  Share2,
} from "lucide-react";
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

function FlowExplorerLink({ circleId }: { circleId: number }) {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet"
    ? "mainnet"
    : "testnet";
  const url = `https://www.flowscan.io/${network}/search?q=circle_${circleId}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-green-200 hover:text-green-300 transition-colors"
    >
      View on Flowscan <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default function CircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);


  const circleId = params.id as string;
  const { circle, members, history, isLoading, error, refetch } = useCircle(circleId);

  const [isJoining, setIsJoining] = useState(false);

  const currentUserPosition = members.findIndex(
    (m) =>
      m.user_id === user?.id ||
      (!!m.flow_address && m.flow_address === user?.flow_address)
  );
  const isMember = currentUserPosition !== -1;

  const handleJoin = async () => {
    if (!circle) return;
    try {
      setIsJoining(true);
      toast({ title: "Joining circle…", description: "Submitting to Flow blockchain." });
      const { tx_id } = await CircleService.joinCircle(String(circle.id));
      await CircleService.waitForTx(tx_id);
      toast({
        title: "You've joined!",
        description: `Welcome to "${circle.name}".`,
        className: "border-green-500 bg-green-50",
      });
      refetch();
    } catch (err: any) {
      toast({
        title: "Failed to join",
        description:
          err?.response?.data?.detail || err?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !circle) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground mb-4">
            {error ?? "Circle not found."}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </DashboardLayout>
    );
  }



  const handleShare = async () => {
    if (isMember) {
      // Members get a proper invite link with their ID embedded
      try {
        setIsGeneratingInvite(true);
        const { invite_link } = await CircleService.generateInviteLink(`${circle.id}`);
        try {
          await navigator.share({ title: circle.name, url: invite_link });
        } catch {
          await navigator.clipboard.writeText(invite_link);
          toast({ title: "Invite link copied!", description: "Share it to invite someone." });
        }
      } catch (err: any) {
        toast({
          title: "Couldn't generate invite",
          description: err?.response?.data?.detail || "Try again.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingInvite(false);
      }
    } else {
      // Non-members just copy the current page URL
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };




  const totalRounds = members.length; // one round per member
  const scheduleLabel: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleShare}
              disabled={isGeneratingInvite}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title={isMember ? "Generate invite link" : "Copy link"}
            >
              {isGeneratingInvite
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Share2 className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Circle header card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#06413F] to-[#0a6360] text-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold leading-tight">{circle.name}</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {circle.member_count} member
                {circle.member_count !== 1 ? "s" : ""} ·{" "}
                {scheduleLabel[circle.payout_schedule] ?? circle.payout_schedule}
              </p>
            </div>
            {circle.is_complete && (
              <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                Complete
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">
              {formatAmount(circle.contribution_amount, circle.currency)}
            </span>
            <span className="text-white/60 text-sm">/ round</span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">
              Chain ID #{circle.chain_circle_id}
            </p>
            <FlowExplorerLink circleId={circle.chain_circle_id} />
          </div>
        </div>

        {/* Payout reveal — shown only to the current rotation winner */}
        <PayoutReveal circle={circle} />

        {/* Join button — shown only to non-members */}
        {!isMember && !circle.is_complete && (
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isJoining ? "Joining…" : "Join this circle"}
          </Button>
        )}

        {/* Contribute CTA — shown to members who haven't contributed yet */}
        <div className="flex justify-center items-center">
          {isMember &&
          members[currentUserPosition] &&
          !members[currentUserPosition].has_contributed_this_round &&
          !circle.is_complete && (
            <Link href={`/dashboard/circle/${circle.id}/contribute`}>
              <Button className="w-fit bg-primary hover:bg-primary/90 text-white">
                Contribute this round
              </Button>
            </Link>
          )}
        </div>
        

        {/* Member contribution status */}
        <MemberStatusGrid
          members={members}
          currentUserPosition={isMember ? currentUserPosition : undefined}
        />

        {/* Payout queue */}
        <PayoutQueueCard
          members={members}
          yourPosition={
            isMember
              ? members[currentUserPosition]?.payout_position ??
                members[currentUserPosition]?.queue_position ??
                null
              : null
          }
          nextPayoutDate={circle.next_payout_date}
          currentRound={circle.current_round}
          totalRounds={totalRounds}
          currency={circle.currency}
        />

        {/* Contribution history feed */}
        <CircleHistory history={history} isLoading={false} />
      </div>
    </DashboardLayout>
  );
}
