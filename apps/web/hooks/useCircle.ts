"use client";

import { useState, useEffect, useCallback } from "react";
import CircleService, {
  Circle,
  CircleMember,
  CircleHistoryEntry,
} from "@/lib/circle-service";

interface UseCircleResult {
  circle: Circle | null;
  members: CircleMember[];
  history: CircleHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCircle(circleId: number | string): UseCircleResult {
  const id = `${circleId}`;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [history, setHistory] = useState<CircleHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      CircleService.getCircle(id),
      CircleService.getCircleMembers(id),
      CircleService.getCircleHistory(id),
    ])
      .then(([circleData, membersData, historyData]) => {
        if (cancelled) return;
        setCircle(circleData);
        setMembers(membersData);
        setHistory(historyData);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load circle data.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  return { circle, members, history, isLoading, error, refetch };
}

interface UseMyCirclesResult {
  circles: Circle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMyCircles(): UseMyCirclesResult {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    CircleService.getMyCircles()
      .then((data) => {
        if (!cancelled) setCircles(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail || err?.message || "Failed to load circles."
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

  return { circles, isLoading, error, refetch };
}
