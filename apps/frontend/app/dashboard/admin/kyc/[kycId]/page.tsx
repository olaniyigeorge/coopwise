"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/kyc/StatusBadge";
import { StepReviewCard } from "@/components/admin/kyc/StepReviewCard";
import { RejectDialog } from "@/components/admin/kyc/RejectDialog";
import { Button } from "@/components/ui/button";
import {
  getKycSubmission,
  approveStep,
  rejectStep,
  finalizeVerified,
  finalizeRejected,
} from "@/services/kyc-service";
import { ChevronLeft } from "lucide-react";

// ---- Types matching the actual KYCAdminDetailResponse payload ----
// (the old KycSubmissionDetail/KycStep types in @/types/kyc-admin
// describe a shape — top-level `steps[]`, `user` — that this endpoint
// does not send. Defining the real shape here until that file is
// reconciled; see note at the bottom.)

type StepStatus = "not_started" | "submitted" | "approved" | "rejected";
type KycSubmissionStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "verified"
  | "rejected"
  | "expired";

// ASSUMPTION: step slugs used in the approve/reject URL match these
// Pydantic field names. Not confirmed against the FastAPI route enum —
// flag if these don't match.
type KycStep =
  | "personal_info"
  | "contact_info"
  | "identity_verification"
  | "banking_info";

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
  status: StepStatus;
  submitted_at: string | null;
  rejection_reason: string | null;
}

interface KycAdminContactInfo {
  residential_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  status: StepStatus;
  submitted_at: string | null;
  rejection_reason: string | null;
}

interface KycAdminIdentityDetail {
  status: StepStatus;
  document_type: string;
  document_image_url: string | null;
  selfie_image_url: string | null;
  video_url: string | null;
  liveness_check_passed: boolean | null;
  liveness_score: number | null;
  extracted_document_name: string | null;
  legal_full_name: string | null;
  full_name_match_score: number | null;
  provider: string | null;
  provider_reference_id: string | null;
  submitted_at: string | null;
  rejection_reason: string | null;
}

interface KycAdminBankingInfo {
  bank_name: string;
  bank_code: string;
  account_number_last4: string;
  account_name: string;
  provider_verified: boolean;
  account_name_match_score: number | null;
  status: StepStatus;
  submitted_at: string | null;
  rejection_reason: string | null;
}

interface KycAuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  step: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface KycSubmissionDetail {
  kyc_id: string;
  user_id: string;
  user_email: string | null;
  status: KycSubmissionStatus;
  personal_info: KycAdminPersonalInfo | null;
  contact_info: KycAdminContactInfo | null;
  identity_verification: KycAdminIdentityDetail | null;
  banking_info: KycAdminBankingInfo | null;
  audit_log: KycAuditLogEntry[];
}

// A flattened view for rendering — one entry per step, regardless of
// whether that step's object exists yet.
// Discriminated union so StepReviewCard can render step-specific fields
// instead of treating every step like a document upload.
type StepRecord =
  | {
      kind: "personal_info";
      step: "personal_info";
      label: "Personal info";
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminPersonalInfo | null;
    }
  | {
      kind: "contact_info";
      step: "contact_info";
      label: "Contact info";
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminContactInfo | null;
    }
  | {
      kind: "identity_verification";
      step: "identity_verification";
      label: "Identity verification";
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminIdentityDetail | null;
    }
  | {
      kind: "banking_info";
      step: "banking_info";
      label: "Banking info";
      status: StepStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
      data: KycAdminBankingInfo | null;
    };

function deriveSteps(submission: KycSubmissionDetail): StepRecord[] {
  return [
    {
      kind: "personal_info",
      step: "personal_info",
      label: "Personal info",
      status: submission.personal_info?.status ?? "not_started",
      submitted_at: submission.personal_info?.submitted_at ?? null,
      rejection_reason: submission.personal_info?.rejection_reason ?? null,
      data: submission.personal_info,
    },
    {
      kind: "contact_info",
      step: "contact_info",
      label: "Contact info",
      status: submission.contact_info?.status ?? "not_started",
      submitted_at: submission.contact_info?.submitted_at ?? null,
      rejection_reason: submission.contact_info?.rejection_reason ?? null,
      data: submission.contact_info,
    },
    {
      kind: "identity_verification",
      step: "identity_verification",
      label: "Identity verification",
      status: submission.identity_verification?.status ?? "not_started",
      submitted_at: submission.identity_verification?.submitted_at ?? null,
      rejection_reason:
        submission.identity_verification?.rejection_reason ?? null,
      data: submission.identity_verification,
    },
    {
      kind: "banking_info",
      step: "banking_info",
      label: "Banking info",
      status: submission.banking_info?.status ?? "not_started",
      submitted_at: submission.banking_info?.submitted_at ?? null,
      rejection_reason: submission.banking_info?.rejection_reason ?? null,
      data: submission.banking_info,
    },
  ];
}

type MutationKey =
  | { kind: "step"; step: KycStep }
  | { kind: "finalize-verify" }
  | { kind: "finalize-reject" };

export default function KycAdminDetailPage() {
  const { kycId } = useParams<{ kycId: string }>();

  const [submission, setSubmission] = useState<KycSubmissionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Transient error from an approve/reject/finalize action — shown without
  // wiping the already-rendered submission.
  const [actionError, setActionError] = useState<string | null>(null);

  // Which mutation is currently in flight, if any. Used to disable the
  // relevant controls and to show a quiet "Refreshing…" state instead of
  // a full loading skeleton.
  const [pending, setPending] = useState<MutationKey | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [finalizeRejectOpen, setFinalizeRejectOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getKycSubmission(kycId);
      setSubmission(data);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Couldn't load this submission."
      );
    } finally {
      setLoading(false);
    }
  }, [kycId]);

  // Background refetch — does NOT touch `loading`, so the page never
  // blanks. Whatever's on screen stays on screen until this resolves.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getKycSubmission(kycId);
      setSubmission(data);
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : "The action went through, but refreshing failed — reload to see the latest state."
      );
    } finally {
      setRefreshing(false);
    }
  }, [kycId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(step: KycStep) {
    setPending({ kind: "step", step });
    setActionError(null);
    try {
      await approveStep(kycId, step);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't approve this step.");
    } finally {
      setPending(null);
    }
  }

  async function handleReject(step: KycStep, reason: string) {
    setPending({ kind: "step", step });
    setActionError(null);
    try {
      await rejectStep(kycId, step, { reason });
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't reject this step.");
    } finally {
      setPending(null);
    }
  }

  async function handleFinalizeVerify() {
    setPending({ kind: "finalize-verify" });
    setActionError(null);
    try {
      await finalizeVerified(kycId);
      await refresh();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Couldn't finalize this submission."
      );
    } finally {
      setPending(null);
    }
  }

  async function handleFinalizeReject(reason: string) {
    setPending({ kind: "finalize-reject" });
    setActionError(null);
    try {
      await finalizeRejected(kycId, { reason });
      await refresh();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Couldn't reject this submission."
      );
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-brand-ink/[0.06]" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg bg-brand-ink/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (loadError && !submission) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
        <Button variant="outline" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  if (!submission) return null;

  const steps = deriveSteps(submission);
  const allStepsApproved = steps.every((s) => s.status === "approved");
  const isFinalized =
    submission.status === "verified" || submission.status === "rejected";
  const isMutating = pending !== null;

  const displayName =
    submission.personal_info?.legal_full_name ??
    submission.identity_verification?.legal_full_name ??
    "Unnamed applicant";
  const nameMatchScore = submission.identity_verification?.full_name_match_score;
  const submissionRejectionReason = submission.audit_log
    .filter((entry) => entry.step === null && entry.action.includes("reject"))
    .at(-1)?.reason;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/admin/kyc"
        className="text-sm text-brand-secondary flex items-center hover:text-brand-teal"
      >
        <ChevronLeft />
        <>All submissions</> 
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-brand-ink">
            {displayName}
          </h1>
          {submission.user_email && (
            <p className="mt-0.5 text-sm text-brand-secondary">
              {submission.user_email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {refreshing && (
            <span className="text-xs text-brand-secondary">Refreshing…</span>
          )}
          <StatusBadge status={submission.status} />
        </div>
      </div>

      {typeof nameMatchScore === "number" && (
        <p className="mt-2 text-xs text-brand-secondary">
          Name match confidence:{" "}
          <span className="font-medium text-brand-ink">
            {Math.round(nameMatchScore)}%
          </span>
        </p>
      )}

      <div className="tally-divider my-6 text-brand-ink" />

      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {steps.map((record) => (
          <StepReviewCard
            key={record.step}
            record={record}
            disabled={isFinalized || record.status === "not_started" || isMutating}
            onApprove={() => handleApprove(record.step)}
            onReject={(reason) => handleReject(record.step, reason)}
          />
        ))}
      </div>

      {submission.status === "rejected" && submissionRejectionReason && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Finalized as rejected:</span>{" "}
          {submissionRejectionReason}
        </div>
      )}

      {!isFinalized && (
        <>
          <div className="tally-divider my-6 text-brand-ink" />
          <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/[0.06] p-5">
            <h2 className="font-display text-base text-brand-ink">
              Finalize submission
            </h2>
            <p className="mt-1 text-sm text-brand-secondary">
              {allStepsApproved
                ? "All steps are approved. Verifying grants full account access."
                : "All steps must be approved before this submission can be verified. You can still reject outright."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                disabled={!allStepsApproved || isMutating}
                onClick={handleFinalizeVerify}
                className="bg-brand-teal hover:bg-brand-teal/90 text-white"
              >
                {pending?.kind === "finalize-verify" ? "Verifying…" : "Finalize as verified"}
              </Button>
              <Button
                variant="outline"
                disabled={isMutating}
                onClick={() => setFinalizeRejectOpen(true)}
                className="border-red-700/40 text-red-700 hover:bg-red-50"
              >
                Reject submission
              </Button>
            </div>
          </div>
        </>
      )}

      <RejectDialog
        open={finalizeRejectOpen}
        onOpenChange={setFinalizeRejectOpen}
        title="Reject KYC submission"
        description="This rejects the entire submission, not just one step. The applicant can restart verification."
        onConfirm={handleFinalizeReject}
      />
    </div>
  );
}