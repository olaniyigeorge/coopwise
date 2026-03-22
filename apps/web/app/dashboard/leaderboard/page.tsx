"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { useLeaderboard, LeaderboardCircle } from "@/hooks/useLeaderboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Users,
  Repeat2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// ─── Platform stat card ───────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {value === undefined ? (
          <div className="h-6 w-16 bg-muted rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-xl font-bold text-foreground">
            {value.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Circle rank card ────────────────────────────────────────────────────────

interface CircleRankCardProps {
  rank: number;
  circle: LeaderboardCircle;
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-400 text-white",
  2: "bg-slate-400 text-white",
  3: "bg-orange-400 text-white",
};

function CircleRankCard({ rank, circle }: CircleRankCardProps) {
  const badgeClass =
    RANK_STYLES[rank] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Rank badge */}
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badgeClass}`}
      >
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {circle.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {circle.member_count} member{circle.member_count !== 1 ? "s" : ""} ·
          Round {circle.current_round}
        </p>
      </div>

      {/* Contribution count */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">
          {circle.total_contributions.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">contributions</p>
      </div>

      {/* Flowscan link */}
      <a
        href={`https://${
          process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet" ? "" : "testnet."
        }flowscan.io/search?q=circle_${circle.chain_circle_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
        title="View on Flowscan"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function RankSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          </div>
          <div className="h-5 w-10 bg-muted rounded animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { data, isLoading, error, refetch } = useLeaderboard();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Most active circles by number of contributions — no amounts shown.
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

        {/* Privacy banner */}
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5 text-sm text-emerald-800">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          <p>
            <strong>No money figures here.</strong> All ranks are based on
            contribution counts only. Amounts are encrypted on-chain by Zama FHE
            and are never visible to anyone — including CoopWise.
          </p>
        </div>

        {/* Platform stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Active circles"
            value={data?.platform_stats.total_circles}
            icon={<Repeat2 className="w-5 h-5" />}
          />
          <StatCard
            label="Members"
            value={data?.platform_stats.total_members}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Contributions made"
            value={data?.platform_stats.total_contributions}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Circles completed"
            value={data?.platform_stats.completed_circles}
            icon={<Trophy className="w-5 h-5" />}
          />
        </div>

        {/* Top circles */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/40">
            <h2 className="text-sm font-semibold text-foreground">
              Top circles by activity
            </h2>
          </div>

          {error && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {error}
              <button
                onClick={refetch}
                className="ml-2 underline text-primary"
              >
                Retry
              </button>
            </div>
          )}

          {!error && isLoading && <RankSkeleton />}

          {!error && !isLoading && data?.top_circles.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No circles yet — be the first to{" "}
              <Link
                href="/dashboard/create-circle"
                className="text-primary underline"
              >
                start one
              </Link>
              !
            </div>
          )}

          {!error && !isLoading && data && data.top_circles.length > 0 && (
            <ul>
              {data.top_circles.map((circle, idx) => (
                <li key={circle.chain_circle_id}>
                  <CircleRankCard rank={idx + 1} circle={circle} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer disclaimer */}
        <p className="text-[11px] text-center text-muted-foreground">
          Powered by Flow blockchain · Amounts encrypted by Zama FHE ·{" "}
          <a
            href={
              process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet"
                ? "https://flowscan.io"
                : "https://testnet.flowscan.io"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Verify any transaction on Flowscan
          </a>
        </p>
      </div>
    </DashboardLayout>
  );
}
