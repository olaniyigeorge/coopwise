"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlatformStats {
  total_circles: number;
  total_members: number;
  total_contributions: number;
  completed_circles: number;
  /** NOTE: No monetary figures — counts only */
}

export interface LeaderboardCircle {
  name: string;
  chain_circle_id: number;
  total_contributions: number;
  member_count: number;
  current_round: number;
}

export interface LeaderboardData {
  platform_stats: PlatformStats;
  top_circles: LeaderboardCircle[];
}

interface UseLeaderboardResult {
  data: LeaderboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Fetches the public leaderboard — circle activity counts only.
 * No authentication required (public endpoint).
 * No amounts are ever returned from this endpoint.
 */
export function useLeaderboard(): UseLeaderboardResult {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    axios
      .get<LeaderboardData>("/api/v1/leaderboard")
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Failed to load leaderboard."
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

  return { data, isLoading, error, refetch };
}
