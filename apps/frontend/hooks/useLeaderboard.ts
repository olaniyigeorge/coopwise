"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── Types

export interface PlatformStats {
  total_circles: number;
  active_circles: number;
  total_members: number;
  total_contributions: number;
}

export interface LeaderboardCircle {
  group_id: string;
  name: string;
  status: string;
  member_count: number;
  contribution_count: number;
  contributor_count: number;
  score: number;
  activity_count: number;
  goal_count: number;
  goals_completed: number;
  join_requests: number;
  invite_count: number;
}

export interface LeaderboardMember {
  user_id: string;
  name: string;
  score: number;
  activity_count: number;
  contribution_count: number;
  goals_created: number;
  goals_completed: number;
  join_requests: number;
  invite_count: number;
}

export interface LeaderboardData {
  platform_stats: PlatformStats;
  top_circles: LeaderboardCircle[];
  top_members: LeaderboardMember[];
}

interface UseLeaderboardResult {
  data: LeaderboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Hook

/**
 * Activity leaderboard. Scores use counts (activity, contributions, goals,
 * join requests, invites). Amounts are never returned.
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
