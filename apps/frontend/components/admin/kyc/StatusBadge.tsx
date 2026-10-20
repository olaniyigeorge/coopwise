// components/admin/kyc/StatusBadge.tsx
import { cn } from "@/lib/utils";
import type { KycSubmissionStatus, KycStepStatus } from "@/types/kyc-admin";

type Status = KycSubmissionStatus | KycStepStatus;

const CONFIG: Record<
  Status,
  { label: string; className: string; dotClassName: string }
> = {
  // KYCStepStatus
  pending: {
    label: "Pending",
    className: "bg-content/[0.04] text-content/50 ring-content/10",
    dotClassName: "bg-content/30",
  },
  submitted: {
    label: "In review",
    className:
      "bg-[#B8892B]/10 text-[#9A7124] ring-[#B8892B]/25 dark:text-[#E8BC63]",
    dotClassName: "bg-[#B8892B]",
  },
  approved: {
    label: "Approved",
    className:
      "bg-[#DFF0E4] text-[#17603F] ring-[#17603F]/15 dark:bg-[#1C3A2C] dark:text-[#B7E3C3] dark:ring-[#7FBF9C]/25",
    dotClassName: "bg-[#17603F] dark:bg-[#B7E3C3]",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
    dotClassName: "bg-red-600 dark:bg-red-400",
  },

  // KYCStatus (submission-level) — pending/approved/rejected are shared
  // with KYCStepStatus above, only the submission-only values are new.
  not_started: {
    label: "Not started",
    className: "bg-content/[0.04] text-content/45 ring-content/10",
    dotClassName: "bg-content/25",
  },
  in_progress: {
    label: "In progress",
    className:
      "bg-[#0E3B2E]/[0.07] text-[#0E3B2E] ring-[#0E3B2E]/15 dark:bg-[#7FBF9C]/10 dark:text-[#7FBF9C] dark:ring-[#7FBF9C]/20",
    dotClassName: "bg-[#0E3B2E] dark:bg-[#7FBF9C]",
  },
  pending_review: {
    label: "In review",
    className:
      "bg-[#B8892B]/10 text-[#9A7124] ring-[#B8892B]/25 dark:text-[#E8BC63]",
    dotClassName: "bg-[#B8892B]",
  },
  verified: {
    label: "Verified",
    className:
      "bg-[#0E3B2E] text-white ring-[#0E3B2E] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:ring-[#7FBF9C]",
    dotClassName: "bg-white/80 dark:bg-[#0B1712]/60",
  },
  expired: {
    label: "Expired",
    className: "bg-content/[0.04] text-content/45 ring-content/10",
    dotClassName: "bg-content/25",
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
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        cfg.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dotClassName)} />
      {cfg.label}
    </span>
  );
}
