import { useCallback, useEffect, useRef, useState } from "react";
import type { TimeRange } from "./types";

const AUTO_REFRESH: Partial<Record<TimeRange, number>> = {
  "1m": 10_000,
  "5m": 30_000,
  "15m": 60_000,
  "1h": 120_000,
};

interface UseGA4DataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function useGA4Data<T>(endpoint: string, range: TimeRange): UseGA4DataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (isAutoRefresh = false) => {
      if (!isAutoRefresh) setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const url = endpoint.includes("?")
          ? `${endpoint}&range=${range}`
          : `${endpoint}?range=${range}`;
        const res = await fetch(url, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as T;
        setData(json);
        setError(null);
        setLastUpdated(Date.now());
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
      } finally {
        if (!isAutoRefresh) setLoading(false);
      }
    },
    [endpoint, range],
  );

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  // Auto-refresh for realtime ranges
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const refreshMs = AUTO_REFRESH[range];
    if (!refreshMs) return;

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        fetchData(true);
        intervalRef.current = setInterval(() => fetchData(true), refreshMs);
      }
    };

    intervalRef.current = setInterval(() => fetchData(true), refreshMs);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [range, fetchData]);

  return { data, loading, error, lastUpdated };
}

export function isRealtimeRange(range: TimeRange): boolean {
  return range in AUTO_REFRESH;
}
