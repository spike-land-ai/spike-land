import type { EnhancementTier, JobStatus, PipelineStage } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

export interface MixHistoryItem {
  id: string;
  tier: EnhancementTier;
  status: JobStatus;
  currentStage: PipelineStage | null;
  resultUrl: string | null;
  resultWidth: number | null;
  resultHeight: number | null;
  createdAt: string;
  targetImage: {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
  } | null;
  sourceImage: {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
  } | null;
}

interface UseMixHistoryReturn {
  mixes: MixHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMixHistory(limit: number = 20): UseMixHistoryReturn {
  const [mixes, setMixes] = useState<MixHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMixes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/mix-history?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch mix history");
      }

      const data = await response.json();
      setMixes(data.mixes);
    } catch (err) {
      console.error("Failed to fetch mix history:", err);
      setError("Failed to load mix history");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchMixes();
  }, [fetchMixes]);

  return {
    mixes,
    isLoading,
    error,
    refetch: fetchMixes,
  };
}
