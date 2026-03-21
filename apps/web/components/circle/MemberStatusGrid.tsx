"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { CircleMember } from "@/lib/circle-service";

interface MemberStatusGridProps {
  members: CircleMember[];
  /** Zero-based position of the current logged-in user (to highlight their row) */
  currentUserPosition?: number;
}

/**
 * Shows who has contributed this round — ✓ or ✗ only.
 * Individual amounts are encrypted on-chain (Zama FHE) and are never shown here.
 */
export function MemberStatusGrid({
  members,
  currentUserPosition,
}: MemberStatusGridProps) {
  if (!members.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No members yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="px-4 py-3 border-b border-border bg-muted/40">
        <h3 className="text-sm font-semibold text-foreground">
          Contribution status — Round {members[0] ? "current" : ""}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Amounts are private. Only contribution status is shown.
        </p>
      </div>

      <ul className="divide-y divide-border">
        {members.map((member, idx) => {
          const isYou = currentUserPosition !== undefined && idx === currentUserPosition;
          return (
            <li
              key={member.user_id || idx}
              className={`flex items-center gap-3 px-4 py-3 ${
                isYou ? "bg-primary/5" : ""
              }`}
            >
              {/* Position badge */}
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                {idx + 1}
              </span>

              {/* Name + address */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.full_name || "Unknown"}
                  {isYou && (
                    <span className="ml-1.5 text-xs font-normal text-primary">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {member.flow_address
                    ? `${member.flow_address.slice(0, 8)}…`
                    : "No wallet yet"}
                </p>
              </div>

              {/* Contribution status */}
              {member.has_contributed_this_round ? (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  Paid
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-rose-500">
                  <XCircle className="w-5 h-5" />
                  Pending
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Footer summary */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {members.filter((m) => m.has_contributed_this_round).length} /{" "}
          {members.length} contributed
        </span>
        <span className="text-[10px] italic">
          Powered by Zama FHE — amounts hidden on-chain
        </span>
      </div>
    </div>
  );
}
