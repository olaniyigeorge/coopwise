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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<KycSubmissionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // reset to page 1 whenever the filter set changes
  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-brand-gold">
          Admin
        </p>
        <h1 className="font-display text-2xl text-brand-ink sm:text-3xl">
          KYC review
        </h1>
        <p className="mt-1 text-sm text-brand-secondary">
          Verify identity documents before members can transact.
        </p>
      </div>

      <div className="tally-divider mb-6 text-brand-ink" />

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                status === tab.value
                  ? "border-brand-teal bg-brand-teal text-brand-ink"
                  : "border-brand-ink/15 text-brand-secondary hover:border-brand-teal/40"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-white/60 sm:w-64"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <SubmissionsTable items={items} loading={loading} />

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-brand-secondary">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{" "}
            {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}