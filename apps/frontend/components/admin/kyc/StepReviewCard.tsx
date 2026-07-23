"use client";

import { useState } from "react";
import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import { RejectDialog } from "./RejectDialog";
import { Button } from "@/components/ui/button";

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

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-brand-secondary">{label}</dt>
      <dd className="text-sm text-brand-ink">{value}</dd>
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

// Each step's own body — no shared "document_url" concept, since only
// identity verification actually has documents.
function StepBody({ record }: { record: StepRecord }) {
  if (!record.data) {
    return (
      <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-brand-ink/15 text-sm text-brand-secondary">
        Not submitted yet
      </div>
    );
  }

  switch (record.kind) {
    case "personal_info": {
      const d = record.data;
      return (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              <a
                href={d.document_image_url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md border border-brand-ink/10"
              >
                <Image
                  src={d.document_image_url}
                  alt="Identity document"
                  width={320}
                  height={200}
                  className="h-32 w-full object-cover"
                  unoptimized
                />
              </a>
            )}
            {d.selfie_image_url && (
              <a
                href={d.selfie_image_url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md border border-brand-ink/10"
              >
                <Image
                  src={d.selfie_image_url}
                  alt="Selfie"
                  width={320}
                  height={200}
                  className="h-32 w-full object-cover"
                  unoptimized
                />
              </a>
            )}
          </div>
          {d.video_url && (
            <a
              href={d.video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-brand-teal hover:underline"
            >
              View liveness video →
            </a>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
    <div className="rounded-lg border border-brand-ink/10 bg-white/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base text-brand-ink">
            {record.label}
          </h3>
          {submittedLabel && (
            <p className="mt-0.5 text-xs text-brand-secondary">
              Submitted {submittedLabel}
            </p>
          )}
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="tally-divider my-4 text-brand-ink" />

      <StepBody record={record} />

      {record.status === "rejected" && record.rejection_reason && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {record.rejection_reason}
        </p>
      )}

      {isReviewable && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled || approving}
            onClick={async () => {
              setApproving(true);
              try {
                await onApprove();
              } finally {
                setApproving(false);
              }
            }}
            className="bg-brand-ink hover:bg-brand-ink/90 text-white"
          >
            {approving ? "Approving…" : "Approve step"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => setRejectOpen(true)}
            className="border-red-700/40 text-red-700 hover:bg-red-50 hover:text-red-600"
          >
            Reject step
          </Button>
        </div>
      )}

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