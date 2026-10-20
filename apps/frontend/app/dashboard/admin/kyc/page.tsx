// app/dashboard/admin/kyc/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmissionsTable } from "@/components/admin/kyc/SubmissionsTable";
import { listKycSubmissions } from "@/services/kyc-service";
import type {
  KycSubmissionListItem,
  KycSubmissionStatus,
} from "@/types/kyc-admin";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

const TABS: { value: KycSubmissionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending review" },
  { value: "in_progress", label: "In progress" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const PAGE_SIZE = 20;

export default function KycAdminListPage() {
  const [status, setStatus] = useState<KycSubmissionStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<KycSubmissionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listKycSubmissions({
        status,
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't load submissions — try again."
      );
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8892B]">
            Admin · Compliance
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
            KYC review
          </h1>
          <p className="mt-1 text-sm text-content/50">
            Verify identity documents before members can transact.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-content/10 bg-surface px-3 py-1.5 text-[11px] font-medium text-content/50 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0E3B2E] dark:text-[#7FBF9C]" />
            {total} submission{total === 1 ? "" : "s"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPage}
            disabled={loading}
            className="h-9 gap-1.5 rounded-xl border-content/15 text-content/60 hover:bg-content/[0.04] hover:text-content"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="tally-divider my-5 text-content/40" />

      {/* ── Filters ── */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 overflow-x-auto pb-1 lg:mx-0 lg:pb-0">
          <div className="flex min-w-max items-center gap-1 rounded-xl border border-content/10 bg-surface p-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                aria-pressed={status === tab.value}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  status === tab.value
                    ? "bg-[#0E3B2E] text-white shadow-sm dark:bg-[#7FBF9C] dark:text-[#0B1712]"
                    : "text-content/50 hover:bg-content/[0.04] hover:text-content"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content/30" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            aria-label="Search submissions"
            className="h-10 w-full rounded-xl border-content/15 bg-surface pl-9 text-sm text-content placeholder:text-content/35 focus-visible:border-[#0E3B2E]/40 focus-visible:ring-[#0E3B2E]/15 dark:focus-visible:border-[#7FBF9C]/45 dark:focus-visible:ring-[#7FBF9C]/20"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            onClick={fetchPage}
            className="text-xs font-semibold underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <SubmissionsTable items={items} loading={loading} />

      {!loading && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-content/45">
          <span className="tabular-nums">
            Showing {firstRow}–{lastRow} of {total}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 gap-1 rounded-lg border-content/15 px-2.5 text-xs text-content/60 hover:bg-content/[0.04] hover:text-content"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="px-1 tabular-nums text-content/35">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 gap-1 rounded-lg border-content/15 px-2.5 text-xs text-content/60 hover:bg-content/[0.04] hover:text-content"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
