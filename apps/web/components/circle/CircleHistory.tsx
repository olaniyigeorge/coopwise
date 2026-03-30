"use client";

import React from "react";
import { ExternalLink, History, ShieldCheck } from "lucide-react";
import { CircleHistoryEntry } from "@/lib/circle-service";

interface CircleHistoryProps {
  history: CircleHistoryEntry[];
  isLoading?: boolean;
}

/** Returns "2 hours ago", "3 days ago", etc. */
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Derive simple initials avatar colour from an address */
function addressColor(address: string | null | undefined): string {
  const colours = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const code = (address ?? "")
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colours[code % colours.length];
}

function Initials({
  name,
  address,
}: {
  name: string;
  address: string | null | undefined;
}) {
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${addressColor(
        address
      )}`}
    >
      {letters || "?"}
    </span>
  );
}

function HistorySkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded animate-pulse w-2/3" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          </div>
          <div className="h-3 bg-muted rounded animate-pulse w-16" />
        </li>
      ))}
    </ul>
  );
}

export function CircleHistory({ history, isLoading }: CircleHistoryProps) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <History className="w-4 h-4" />
          Circle history
        </h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          No amounts shown
        </span>
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : history.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No contributions yet — be the first!
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {history.map((entry, idx) => (
            <li
              key={entry.tx_id ?? idx}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Avatar */}
              <Initials
                name={entry.member_name}
                address={entry.member_address}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  <span className="font-semibold">{entry.member_name}</span>
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    contributed
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Round {entry.round}
                </p>
              </div>

              {/* Right — time + verify link */}
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(
                    entry.submitted_at ?? entry.created_at ?? new Date().toISOString()
                  )}
                </p>
                {entry.explorer_url && (
                  <a
                    href={entry.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    Verify <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Footer note */}
      {history.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground text-center">
          Contribution amounts are encrypted on-chain (Zama FHE) and never
          stored in plain text — not even by CoopWise.
        </div>
      )}
    </div>
  );
}
