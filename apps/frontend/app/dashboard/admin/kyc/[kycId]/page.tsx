"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
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
  reopenKycStep,
} from "@/services/kyc-service";
import {
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  | { kind: "finalize-reject" }
  | { kind: "reopen" };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <dt className="text-content/40">{label}</dt>
      <dd className="text-right font-medium text-content/80">{value}</dd>
    </div>
  );
}

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

  async function handleReopen() {
    setPending({ kind: "reopen" });
    setActionError(null);
    try {
      await reopenKycStep(kycId, "banking_info");
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't reopen this KYC step.");
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-content/[0.05]" />
        <div className="mt-5 flex items-center gap-3.5">
          <div className="h-12 w-12 animate-pulse rounded-full bg-content/[0.06]" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-content/[0.06]" />
            <div className="h-3 w-32 animate-pulse rounded bg-content/[0.05]" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-content/[0.04]"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-content/[0.04]" />
        </div>
      </div>
    );
  }

  if (loadError && !submission) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {loadError}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-red-500/25 text-red-600 hover:bg-red-500/[0.06] dark:text-red-400"
            onClick={load}
          >
            Retry
          </Button>
        </div>
        <Link
          href="/dashboard/admin/kyc"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-content/45 hover:text-content"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to all submissions
        </Link>
      </div>
    );
  }

  if (!submission) return null;

  const steps = deriveSteps(submission);
  const approvedCount = steps.filter((s) => s.status === "approved").length;
  const progress = Math.round((approvedCount / steps.length) * 100);
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/admin/kyc"
        className="inline-flex items-center gap-1 text-xs font-semibold text-content/45 transition-colors hover:text-content"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All submissions
      </Link>

      {/* ── Header ── */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E]/[0.07] font-display text-base font-bold text-[#0E3B2E] dark:bg-[#7FBF9C]/12 dark:text-[#7FBF9C]">
            {initials(displayName)}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8892B]">
              KYC submission
            </p>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-content">
              {displayName}
            </h1>
            {submission.user_email && (
              <p className="truncate text-xs text-content/40">
                {submission.user_email}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={submission.status} />
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-content/30">
            {refreshing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating
              </>
            ) : (
              <>Ref #{submission.kyc_id.slice(0, 8)}</>
            )}
          </span>
        </div>
      </div>

      <div className="tally-divider my-6 text-content/40" />

      {actionError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Steps ── */}
        <div className="space-y-4">
          {steps.map((record) => (
            <StepReviewCard
              key={record.step}
              record={record}
              disabled={
                isFinalized || record.status === "not_started" || isMutating
              }
              onApprove={() => handleApprove(record.step)}
              onReject={(reason) => handleReject(record.step, reason)}
            />
          ))}
        </div>

        {/* ── Sticky summary ── */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-content/10 bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)]">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-content/40">
              Review progress
            </h2>
            <div className="mt-3 flex items-end justify-between">
              <p className="font-display text-3xl font-bold leading-none tracking-tight text-content tabular-nums">
                {approvedCount}
                <span className="text-base font-medium text-content/25">
                  /{steps.length}
                </span>
              </p>
              <p className="pb-0.5 text-[11px] text-content/40">
                steps approved
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-content/10">
              <div
                className="h-full rounded-full bg-[#0E3B2E] transition-[width] duration-500 dark:bg-[#7FBF9C]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <dl className="mt-4 space-y-2 border-t border-content/[0.07] pt-4">
              <SummaryRow
                label="Status"
                value={<StatusBadge status={submission.status} />}
              />
              {typeof nameMatchScore === "number" && (
                <SummaryRow
                  label="Name match"
                  value={`${Math.round(nameMatchScore)}%`}
                />
              )}
              <SummaryRow
                label="Latest submission"
                value={formatDateTime(
                  steps
                    .map((s) => s.submitted_at)
                    .filter((d): d is string => Boolean(d))
                    .sort()
                    .at(-1) ?? null
                )}
              />
            </dl>
          </div>

          {!isFinalized ? (
            <div className="rounded-2xl border border-[#B8892B]/30 bg-[#B8892B]/[0.05] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#B8892B]" />
                <h2 className="font-display text-sm font-bold text-content">
                  Final decision
                </h2>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-content/50">
                {allStepsApproved
                  ? "All steps are approved. Verifying grants full account access."
                  : "All steps must be approved before this submission can be verified. You can still reject outright."}
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  disabled={!allStepsApproved || isMutating}
                  onClick={handleFinalizeVerify}
                  className="h-10 w-full gap-1.5 rounded-xl bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0B1712] disabled:opacity-40 dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#9ACFAC]"
                >
                  {pending?.kind === "finalize-verify" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {pending?.kind === "finalize-verify"
                    ? "Verifying…"
                    : "Verify member"}
                </Button>
                <Button
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => setFinalizeRejectOpen(true)}
                  className="h-10 w-full gap-1.5 rounded-xl border-red-600/25 text-xs font-semibold text-red-600 hover:bg-red-500/[0.06] hover:text-red-600 dark:text-red-400"
                >
                  <XCircle className="h-4 w-4" />
                  Reject submission
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-2xl border p-5",
                submission.status === "verified"
                  ? "border-[#0E3B2E]/20 bg-[#DFF0E4]/50 dark:border-[#7FBF9C]/20 dark:bg-[#7FBF9C]/[0.06]"
                  : "border-red-500/20 bg-red-500/[0.05]"
              )}
            >
              <div className="flex items-center gap-2">
                {submission.status === "verified" ? (
                  <BadgeCheck className="h-4 w-4 text-[#17603F] dark:text-[#B7E3C3]" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <h2 className="font-display text-sm font-bold text-content">
                  {submission.status === "verified"
                    ? "Submission verified"
                    : "Submission rejected"}
                </h2>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-content/50">
                {submission.status === "verified"
                  ? "This member has full access. Reopen the banking step if they need to replace or resubmit their bank details."
                  : "The applicant can amend their details and restart verification."}
              </p>
              {submission.status === "verified" && (
                <Button
                  variant="outline"
                  disabled={isMutating}
                  onClick={handleReopen}
                  className="mt-4 h-10 w-full gap-1.5 rounded-xl border-[#B8892B]/35 text-xs font-semibold text-[#8A6516] hover:bg-[#B8892B]/[0.08] dark:text-[#E8BC63]"
                >
                  {pending?.kind === "reopen" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {pending?.kind === "reopen" ? "Reopening…" : "Reopen banking step"}
                </Button>
              )}
              {submission.status === "rejected" &&
                submissionRejectionReason && (
                  <p className="mt-3 rounded-lg border border-red-500/15 bg-surface/60 px-3 py-2 text-[11px] leading-relaxed text-red-600 dark:text-red-400">
                    {submissionRejectionReason}
                  </p>
                )}
            </div>
          )}

          {submission.audit_log.length > 0 && (
            <div className="rounded-2xl border border-content/10 bg-surface p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-content/40">
                Review activity
              </h2>
              <ul className="mt-3 space-y-3">
                {submission.audit_log
                  .slice(-5)
                  .reverse()
                  .map((entry) => (
                    <li key={entry.id} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8892B]/60" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold capitalize text-content/75">
                          {entry.action.replaceAll("_", " ")}
                        </p>
                        {entry.step && (
                          <p className="text-[10px] text-content/35">
                            {entry.step.replaceAll("_", " ")}
                          </p>
                        )}
                        {entry.reason && (
                          <p className="mt-0.5 text-[10px] leading-relaxed text-content/40">
                            “{entry.reason}”
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] tabular-nums text-content/30">
                          {formatDateTime(entry.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

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
