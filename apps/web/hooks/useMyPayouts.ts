"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AuthService from "@/lib/auth-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PayoutStatus = "pending" | "processing" | "complete" | "failed";

export interface MyPayout {
  circle_name: string;
  round: number;
  /** Amount in local currency (NGN/KES/GHS) — visible ONLY to the recipient */
  amount_local: number;
  currency: string;
  transferred_at: string | null;
  status: PayoutStatus;
  /** Flow transaction ID of the TriggerRotation.cdc tx */
  tx_id: string;
  /** Flowscan link — shows encrypted payload on-chain */
  explorer_url: string;
}

interface UseMyPayoutsResult {
  payouts: MyPayout[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Fetches the current user's personal payout history.
 *
 * Privacy model:
 *   - Amounts are shown ONLY to the recipient (the endpoint is authenticated
 *     and filters by current_user.id on the backend).
 *   - Other circle members can NEVER see these amounts — not through this
 *     endpoint, not through /circles/{id}/history, not anywhere in the app.
 *   - The amounts are stored AES-256 encrypted in Postgres; the backend
 *     decrypts them in-flight only for the authenticated owner.
 */
export function useMyPayouts(): UseMyPayoutsResult {
  const [payouts, setPayouts] = useState<MyPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    axios
      .get<MyPayout[]>("/api/v1/me/payouts", {
        headers: AuthService.getAuthHeader(),
      })
      .then((res) => {
        if (!cancelled) setPayouts(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Failed to load payout history."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { payouts, isLoading, error, refetch };
}
