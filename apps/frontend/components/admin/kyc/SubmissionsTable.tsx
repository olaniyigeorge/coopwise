// components/admin/kyc/SubmissionsTable.tsx
"use client";

import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import type { KycSubmissionListItem } from "@/types/kyc-admin";
import { ChevronRight } from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function countApprovedSteps(item: KycSubmissionListItem) {
  return STEP_FIELDS.filter((field) => item[field] === "approved").length;
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
      <div className="divide-y divide-brand-ink/10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse bg-brand-ink/[0.03]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-lg text-brand-ink">
          No submissions here
        </p>
        <p className="mt-1 text-sm text-brand-secondary">
          Nothing matches this filter yet — check back once applicants submit.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-brand-ink/10 bg-white/40">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-ink/10 text-xs uppercase tracking-wide text-brand-secondary">
            <th className="px-4 py-3 font-medium">Applicant</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Steps</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-ink/[0.06]">
          {items.map((item) => (
            <tr
              key={item.kyc_id}
              className="transition-colors hover:bg-brand-gold/[0.06]"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-brand-ink">
                  {item.legal_full_name}
                </div>
                {item.user_email && (
                  <div className="text-xs text-brand-secondary">
                    {item.user_email}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-brand-ink">
                {countApprovedSteps(item)}/{STEP_FIELDS.length}
              </td>
              <td className="px-4 py-3 text-brand-secondary">
                {formatDate(item.submitted_at)}
              </td>
              <td className="px-4 py-3 text-brand-secondary">
                {formatDate(item.updated_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/admin/kyc/${item.kyc_id}`}
                  className="text-sm font-medium flex items-center text-brand-teal hover:underline"
                >
                  <>Review </>
                  <ChevronRight className="w-4 h-4"/>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}