// components/admin/kyc/StatusBadge.tsx
import { cn } from "@/lib/utils";
import type { KycSubmissionStatus, KycStepStatus } from "@/types/kyc-admin";

type Status = KycSubmissionStatus | KycStepStatus;

const CONFIG: Record<Status, { label: string; className: string }> = {
  // KYCStepStatus
  pending: {
    label: "Pending",
    className: "border-brand-ink/20 text-brand-secondary bg-transparent",
  },
  submitted: {
    label: "In review",
    className: "border-brand-gold text-brand-gold bg-brand-gold/10",
  },
  approved: {
    label: "Approved",
    className: "border-brand-teal text-brand-teal bg-brand-teal/10",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-700/40 text-red-700 bg-red-50",
  },

  // KYCStatus (submission-level) — pending/approved/rejected are shared
  // with KYCStepStatus above, only the submission-only values are new.
  not_started: {
    label: "Not started",
    className: "border-brand-ink/20 text-brand-secondary bg-transparent",
  },
  in_progress: {
    label: "In progress",
    className: "border-brand-ink/20 text-brand-ink bg-brand-ink/[0.04]",
  },
  pending_review: {
    label: "In review",
    className: "border-brand-gold text-brand-gold bg-brand-gold/10",
  },
  verified: {
    label: "Verified",
    className: "border-brand-teal text-brand-teal bg-brand-teal/10",
  },
  expired: {
    label: "Expired",
    className: "border-brand-ink/20 text-brand-secondary bg-brand-ink/[0.04]",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const cfg = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        cfg.className,
        className
      )}
    >
      {/* verified/approved read as a stamped seal — filled dot instead of an icon dependency */}
      {(status === "verified" || status === "approved") && (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
      )}
      {cfg.label}
    </span>
  );
}