"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Medal,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import DashboardLayout from "@/components/dashboard/layout";
import { useLeaderboard, LeaderboardCircle } from "@/hooks/useLeaderboard";
import CooperativeService from "@/services/cooperative-service";
import type { Cooperative } from "@/types/cooperative";
import { cn } from "@/lib/utils";

/* ────────────────────────── Stats ────────────────────────── */

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
        {icon}
      </span>
      {value === undefined ? (
        <div className="mt-3 h-7 w-16 animate-pulse rounded-md bg-content/5" />
      ) : (
        <p className="mt-3 font-display text-2xl font-bold leading-none tracking-tight text-content">
          {value.toLocaleString()}
        </p>
      )}
      <p className="mt-1.5 text-[11px] font-medium text-content/55">{label}</p>
      <p className="mt-0.5 text-[10px] text-content/35">{hint}</p>
    </div>
  );
}

/* ─────────────────────── Ranked row ─────────────────────── */

const RANK_STYLES: Record<number, string> = {
  1: "bg-[#B8892B] text-white",
  2: "bg-[#8C9AA6] text-white",
  3: "bg-[#B4713D] text-white",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const Icon = rank === 1 ? Crown : Medal;
    return (
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          RANK_STYLES[rank]
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-content/[0.05] text-xs font-bold tabular-nums text-content/55">
      {rank}
    </span>
  );
}

function CircleRow({
  rank,
  circle,
  isMine,
}: {
  rank: number;
  circle: LeaderboardCircle;
  isMine: boolean;
}) {
  return (
    <li className="border-t border-content/[0.06] first:border-t-0">
      <Link
        href={`/dashboard/cooperative/${circle.group_id}`}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-content/[0.02] sm:px-5"
      >
        <RankBadge rank={rank} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-content">
              {circle.name}
            </p>
            {isMine && (
              <span className="rounded-full bg-[#DFF0E4] px-2 py-0.5 text-[10px] font-semibold text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                Your coop
              </span>
            )}
            <span className="rounded-full bg-content/5 px-2 py-0.5 text-[10px] font-semibold capitalize text-content/50">
              {circle.status}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-content/45">
            {circle.member_count} member{circle.member_count === 1 ? "" : "s"}
            {circle.contributor_count > 0 && (
              <>
                {" "}
                · {circle.contributor_count} contributing
              </>
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-content">
            {circle.contribution_count.toLocaleString()}
          </p>
          <p className="text-[10px] text-content/40">
            contribution{circle.contribution_count === 1 ? "" : "s"}
          </p>
        </div>
      </Link>
    </li>
  );
}

function RankSkeleton() {
  return (
    <ul>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 border-t border-content/[0.06] px-5 py-3.5 first:border-t-0">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-content/5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-content/5" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-content/5" />
          </div>
          <div className="h-5 w-10 animate-pulse rounded bg-content/5" />
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function LeaderboardPage() {
  const { data, isLoading, error, refetch } = useLeaderboard();
  const [myCoops, setMyCoops] = useState<Cooperative[]>([]);

  useEffect(() => {
    let cancelled = false;
    CooperativeService.listMyCooperatives()
      .then((groups) => {
        if (!cancelled) setMyCoops(groups ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const myIds = useMemo(
    () => new Set(myCoops.map((coop) => coop.id)),
    [myCoops]
  );

  const myRanked = useMemo(() => {
    if (!data) return [] as { rank: number; circle: LeaderboardCircle }[];
    return data.top_circles
      .map((circle, index) => ({ rank: index + 1, circle }))
      .filter((entry) => myIds.has(entry.circle.group_id));
  }, [data, myIds]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-5 pb-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8892B]">
              Community
            </p>
            <h1 className="mt-1.5 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
              <Trophy className="h-6 w-6 text-[#B8892B]" />
              Leaderboard
            </h1>
            <p className="mt-1 text-sm text-content/50">
              Cooperatives ranked by contribution activity.
            </p>
          </div>
          <button
            type="button"
            onClick={refetch}
            aria-label="Refresh leaderboard"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-content/10 text-content/55 transition-colors hover:bg-content/[0.03] hover:text-content"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* What this measures */}
        <div className="flex items-start gap-3 rounded-2xl border border-[#1F7A54]/15 bg-[#DFF0E4]/60 px-4 py-3.5 dark:border-[#7FBF9C]/20 dark:bg-[#17352A]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A54] dark:text-[#7FBF9C]" />
          <p className="text-sm leading-relaxed text-[#17603F] dark:text-[#B7E3C3]">
            <strong className="font-semibold">Activity, not wallet size.</strong>{" "}
            Ranks count completed contributions — never amounts or member
            details.
          </p>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Cooperatives"
            value={data?.platform_stats.total_circles}
            hint="on CoopWise"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Active now"
            value={data?.platform_stats.active_circles}
            hint="accepting contributions"
            icon={<Sparkles className="h-4 w-4" />}
          />
          <StatCard
            label="Members"
            value={data?.platform_stats.total_members}
            hint="active memberships"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Contributions"
            value={data?.platform_stats.total_contributions}
            hint="completed on platform"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>

        {/* Your standing — only when one of your coops made the board */}
        {myRanked.length > 0 && (
          <div className="rounded-[24px] bg-[#0E3B2E] p-5 text-white shadow-[0_18px_40px_-28px_rgba(14,59,46,0.7)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Your standing
            </p>
            {myRanked.slice(0, 1).map(({ rank, circle }) => (
              <div
                key={circle.group_id}
                className="mt-2 flex flex-wrap items-end justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold tracking-tight">
                    #{rank} · {circle.name}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {circle.contribution_count} contribution
                    {circle.contribution_count === 1 ? "" : "s"} recorded
                  </p>
                </div>
                <Link
                  href={`/dashboard/cooperative/${circle.group_id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Open cooperative
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Ranking */}
        <div className="overflow-hidden rounded-[24px] bg-surface shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <h2 className="font-display text-base font-bold tracking-tight text-content">
              Top cooperatives
            </h2>
            <span className="text-[11px] font-medium text-content/40">
              by contributions
            </span>
          </div>

          {error && (
            <div className="border-t border-content/[0.06] px-5 py-8 text-center text-sm text-content/55">
              {error}
              <button
                type="button"
                onClick={refetch}
                className="ml-2 font-semibold text-[#1F7A54] underline underline-offset-2 dark:text-[#7FBF9C]"
              >
                Retry
              </button>
            </div>
          )}

          {!error && isLoading && <RankSkeleton />}

          {!error && !isLoading && data?.top_circles.length === 0 && (
            <div className="border-t border-content/[0.06] px-5 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]">
                <Trophy className="h-5 w-5" />
              </span>
              <p className="mt-3 font-display text-base font-bold text-content">
                No contributions recorded yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-content/50">
                The board fills up as cooperatives start pooling money. Start
                yours and set the pace.
              </p>
              <Link
                href="/dashboard/create-cooperative"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0E3B2E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
              >
                <Plus className="h-3.5 w-3.5" />
                Create a cooperative
              </Link>
            </div>
          )}

          {!error && !isLoading && data && data.top_circles.length > 0 && (
            <ul>
              {data.top_circles.map((circle, index) => (
                <CircleRow
                  key={circle.group_id}
                  rank={index + 1}
                  circle={circle}
                  isMine={myIds.has(circle.group_id)}
                />
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-[11px] text-content/35">
          Rankings update as contributions are recorded.
        </p>
      </div>
    </DashboardLayout>
  );
}
