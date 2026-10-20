"use client";

import { useState } from "react";
import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import { RejectDialog } from "./RejectDialog";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "not_started" | "submitted" | "approved" | "rejected";

interface KycAdminPersonalInfo {
  legal_full_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  employment_status: string;
  occupation_or_business_type: string;
  source_of_funds: string;
  monthly_income_range: string;
  income_currency: string;
}

interface KycAdminContactInfo {
  residential_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
}

interface KycAdminIdentityDetail {
  document_type: string;
  document_image_url: string | null;
  selfie_image_url: string | null;
  video_url: string | null;
  liveness_check_passed: boolean | null;
  liveness_score: number | null;
  legal_full_name: string | null;
  full_name_match_score: number | null;
}

interface KycAdminBankingInfo {
  bank_name: string;
  bank_code: string;
  account_number_last4: string;
  account_name: string;
  provider_verified: boolean;
  account_name_match_score: number | null;
}

type StepRecord =
  | {
      kind: "personal_info";
      step: "personal_info";
      label: string;
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminPersonalInfo | null;
    }
  | {
      kind: "contact_info";
      step: "contact_info";
      label: string;
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminContactInfo | null;
    }
  | {
      kind: "identity_verification";
      step: "identity_verification";
      label: string;
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminIdentityDetail | null;
    }
  | {
      kind: "banking_info";
      step: "banking_info";
      label: string;
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminBankingInfo | null;
    };

interface StepReviewCardProps {
  record: StepRecord;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  disabled?: boolean;
}

const ACCENT: Record<StepStatus, string> = {
  not_started: "bg-content/15",
  submitted: "bg-[#B8892B]",
  approved: "bg-[#17603F] dark:bg-[#7FBF9C]",
  rejected: "bg-red-500",
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-content/35">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm text-content/85">{value}</dd>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DocumentThumb({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-xl border border-content/10 bg-canvas"
    >
      <Image
        src={src}
        alt={alt}
        width={320}
        height={200}
        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        unoptimized
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-1.5 pt-6 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        {alt}
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

// Each step's own body — no shared "document_url" concept, since only
// identity verification actually has documents.
function StepBody({ record }: { record: StepRecord }) {
  if (!record.data) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-content/15 text-xs text-content/35">
        Not submitted yet
      </div>
    );
  }

  switch (record.kind) {
    case "personal_info": {
      const d = record.data;
      return (
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
          <Field label="Date of birth" value={d.date_of_birth} />
          <Field label="Gender" value={d.gender} />
          <Field label="Nationality" value={d.nationality} />
          <Field label="Employment" value={d.employment_status} />
          <Field label="Occupation" value={d.occupation_or_business_type} />
          <Field label="Source of funds" value={d.source_of_funds} />
          <Field
            label="Monthly income"
            value={`${d.monthly_income_range} (${d.income_currency})`}
          />
        </dl>
      );
    }

    case "contact_info": {
      const d = record.data;
      return (
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
          <Field
            label="Address"
            value={`${d.residential_address}, ${d.city}, ${d.state}`}
          />
          <Field label="Postal code" value={d.postal_code} />
          <Field label="Country" value={d.country} />
          <Field label="Next of kin" value={d.next_of_kin_name} />
          <Field label="Next of kin phone" value={d.next_of_kin_phone} />
        </dl>
      );
    }

    case "identity_verification": {
      const d = record.data;
      return (
        <div>
          <div className="grid grid-cols-2 gap-3">
            {d.document_image_url && (
              <DocumentThumb
                src={d.document_image_url}
                alt="Identity document"
              />
            )}
            {d.selfie_image_url && (
              <DocumentThumb src={d.selfie_image_url} alt="Selfie" />
            )}
          </div>
          {d.video_url && (
            <a
              href={d.video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0E3B2E] hover:underline dark:text-[#7FBF9C]"
            >
              View liveness video
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
            <Field label="Document type" value={d.document_type} />
            <Field
              label="Liveness check"
              value={
                d.liveness_check_passed === null
                  ? null
                  : d.liveness_check_passed
                    ? `Passed (${d.liveness_score ?? "—"}%)`
                    : `Failed (${d.liveness_score ?? "—"}%)`
              }
            />
            <Field
              label="Name match"
              value={
                typeof d.full_name_match_score === "number"
                  ? `${Math.round(d.full_name_match_score)}%`
                  : null
              }
            />
          </dl>
        </div>
      );
    }

    case "banking_info": {
      const d = record.data;
      return (
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:grid-cols-3">
          <Field label="Bank" value={d.bank_name} />
          <Field label="Account" value={`•••• ${d.account_number_last4}`} />
          <Field label="Account name" value={d.account_name} />
          <Field
            label="Provider verified"
            value={d.provider_verified ? "Yes" : "No"}
          />
          <Field
            label="Name match"
            value={
              typeof d.account_name_match_score === "number"
                ? `${Math.round(d.account_name_match_score)}%`
                : null
            }
          />
        </dl>
      );
    }
  }
}

export function StepReviewCard({
  record,
  onApprove,
  onReject,
  disabled,
}: StepReviewCardProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // Only a "submitted" step is awaiting a decision — not_started has
  // nothing to review, approved/rejected are already decided.
  const isReviewable = record.status === "submitted";
  const submittedLabel = formatDate(record.submitted_at);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-content/10 bg-surface shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", ACCENT[record.status])}
      />

      <div className="p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold tracking-tight text-content">
              {record.label}
            </h3>
            {submittedLabel && (
              <p className="mt-0.5 text-[11px] text-content/40">
                Submitted {submittedLabel}
              </p>
            )}
          </div>
          <StatusBadge status={record.status} />
        </div>

        <div className="tally-divider my-4 text-content/35" />

        <StepBody record={record} />

        {record.status === "rejected" && record.rejection_reason && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-xs leading-relaxed text-red-600 dark:text-red-400">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {record.rejection_reason}
          </p>
        )}

        {isReviewable && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={disabled || approving}
              onClick={async () => {
                setApproving(true);
                try {
                  await onApprove();
                } finally {
                  setApproving(false);
                }
              }}
              className="h-9 gap-1.5 rounded-xl bg-[#0E3B2E] px-4 text-xs font-semibold text-white hover:bg-[#0B1712] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#9ACFAC]"
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {approving ? "Approving…" : "Approve step"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || approving}
              onClick={() => setRejectOpen(true)}
              className="h-9 gap-1.5 rounded-xl border-red-600/25 px-4 text-xs font-semibold text-red-600 hover:bg-red-500/[0.06] hover:text-red-600 dark:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
              Reject step
            </Button>
          </div>
        )}
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={`Reject ${record.label}`}
        description="The applicant will see this reason and can resubmit for this step."
        onConfirm={onReject}
      />
    </div>
  );
}
