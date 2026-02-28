import { useCallback, useEffect, useState } from "react";

interface McpJob {
  id: string;
  type: "GENERATE" | "MODIFY";
  tier: string;
  tokensCost: number;
  status: string;
  prompt: string;
  inputImageUrl?: string;
  outputImageUrl?: string;
  outputWidth?: number;
  outputHeight?: number;
  createdAt: string;
  processingCompletedAt?: string;
  apiKeyName?: string;
}

interface HistoryResponse {
  jobs: McpJob[];
  total: number;
  hasMore: boolean;
}

const PAGE_SIZE = 12;

export function useMcpHistory() {
  const [jobs, setJobs] = useState<McpJob[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState<McpJob | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/mcp/history?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data: HistoryResponse = await response.json();
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(0);
  };

  return {
    jobs,
    total,
    totalPages,
    isLoading,
    error,
    typeFilter,
    page,
    selectedJob,
    fetchHistory,
    handleTypeFilterChange,
    setPage,
    setSelectedJob,
  };
}
