// components/admin/kyc/SubmissionsTable.tsx
"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import type { KycSubmissionListItem, KycStepStatus } from "@/types/kyc-admin";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// The four step statuses the backend actually returns per submission.
// Deriving "N/4 approved" from these instead of a steps_completed/
// steps_total pair the API doesn't send.
const STEP_FIELDS = [
  "personal_info_status",
  "contact_info_status",
  "identity_status",
  "banking_status",
] as const;

const STEP_TONE: Record<KycStepStatus, string> = {
  pending: "bg-content/12",
  submitted: "bg-[#B8892B]",
  approved: "bg-[#17603F] dark:bg-[#7FBF9C]",
  rejected: "bg-red-500",
};

function countApprovedSteps(item: KycSubmissionListItem) {
  return STEP_FIELDS.filter((field) => item[field] === "approved").length;
}

function StepTicks({ item }: { item: KycSubmissionListItem }) {
  const approved = countApprovedSteps(item);
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${approved} of ${STEP_FIELDS.length} steps approved`}
    >
      {STEP_FIELDS.map((field) => (
        <span
          key={field}
          className={cn("h-1.5 w-3.5 rounded-full", STEP_TONE[item[field]])}
        />
      ))}
      <span className="ml-1 text-[11px] font-medium tabular-nums text-content/40">
        {approved}/{STEP_FIELDS.length}
      </span>
    </div>
  );
}

function Applicant({ item }: { item: KycSubmissionListItem }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E]/[0.07] text-[11px] font-bold text-[#0E3B2E] dark:bg-[#7FBF9C]/12 dark:text-[#7FBF9C]">
        {initials(item.legal_full_name)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-content">
          {item.legal_full_name}
        </div>
        {item.user_email && (
          <div className="truncate text-[11px] text-content/40">
            {item.user_email}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-content/15 bg-surface/60 px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-content/[0.04] text-content/35">
        <Inbox className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <p className="mt-3 font-display text-base font-semibold text-content">
        No submissions here
      </p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-content/45">
        Nothing matches this filter yet — check back once applicants submit.
      </p>
    </div>
  );
}

export function SubmissionsTable({
  items,
  loading,
}: {
  items: KycSubmissionListItem[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-content/10 bg-surface">
        <div className="h-10 border-b border-content/10 bg-content/[0.02]" />
        <div className="divide-y divide-content/[0.06]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-content/[0.06]" />
              <div className="h-3 w-40 animate-pulse rounded bg-content/[0.06]" />
              <div className="ml-auto h-3 w-20 animate-pulse rounded bg-content/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return <EmptyState />;

  return (
    <>
      {/* ── Desktop table ── */}
      <div className="hidden overflow-hidden rounded-2xl border border-content/10 bg-surface shadow-[0_1px_2px_rgba(11,23,18,0.04)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-content/10 bg-content/[0.02] text-[10px] uppercase tracking-[0.14em] text-content/40">
              <th className="px-5 py-3 font-semibold">Applicant</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Steps</th>
              <th className="px-5 py-3 font-semibold">Submitted</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-content/[0.06]">
            {items.map((item) => (
              <tr
                key={item.kyc_id}
                className="group transition-colors hover:bg-content/[0.03]"
              >
                <td className="max-w-[260px] px-5 py-3.5">
                  <Applicant item={item} />
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-5 py-3.5">
                  <StepTicks item={item} />
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-content/50">
                  {formatDate(item.submitted_at)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-content/50">
                  {formatDate(item.updated_at)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/dashboard/admin/kyc/${item.kyc_id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#0E3B2E] transition-colors hover:bg-[#0E3B2E]/[0.06] dark:text-[#7FBF9C] dark:hover:bg-[#7FBF9C]/10"
                  >
                    Review
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <Link
            key={item.kyc_id}
            href={`/dashboard/admin/kyc/${item.kyc_id}`}
            className="block rounded-2xl border border-content/10 bg-surface p-4 shadow-[0_1px_2px_rgba(11,23,18,0.04)] transition-colors active:bg-content/[0.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <Applicant item={item} />
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-content/[0.07] pt-3">
              <StepTicks item={item} />
              <span className="text-[11px] text-content/40">
                {formatDate(item.submitted_at)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
