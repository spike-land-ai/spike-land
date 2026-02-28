"use client";

import { Button } from "@/components/ui/button";
import { useJobStream } from "@/hooks/useJobStream";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { JobStatus, PipelineStage } from "@prisma/client";
import {
  AlertCircle,
  Download,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export interface MixResult {
  jobId: string;
  resultUrl: string;
  width: number;
  height: number;
}

interface BlendrResultProps {
  activeJobId: string | null;
  hasImages: boolean;
  onComplete?: (result: MixResult) => void;
  onError?: (error: string) => void;
  onRetry?: () => void;
  className?: string;
}

type MixState =
  | { type: "empty"; }
  | { type: "processing"; stage: PipelineStage | null; }
  | { type: "completed"; result: MixResult; }
  | { type: "failed"; error: string; };

export function BlendrResult({
  activeJobId,
  hasImages: _hasImages,
  onComplete,
  onError,
  onRetry,
  className,
}: BlendrResultProps) {
  const [state, setState] = useState<MixState>({ type: "empty" });

  const handleJobComplete = useCallback(
    (job: {
      id: string;
      status: JobStatus;
      currentStage: PipelineStage | null;
      enhancedUrl: string | null;
      enhancedWidth: number | null;
      enhancedHeight: number | null;
    }) => {
      if (job.enhancedUrl) {
        const result: MixResult = {
          jobId: job.id,
          resultUrl: job.enhancedUrl,
          width: job.enhancedWidth || 1024,
          height: job.enhancedHeight || 1024,
        };
        setState({ type: "completed", result });
        onComplete?.(result);
      }
    },
    [onComplete],
  );

  const handleJobError = useCallback(
    (error: string) => {
      setState({ type: "failed", error });
      onError?.(error);
    },
    [onError],
  );

  const { job } = useJobStream({
    jobId: activeJobId,
    onComplete: handleJobComplete,
    onError: handleJobError,
  });

  // Update state when job changes
  useEffect(() => {
    if (!activeJobId) {
      // Only reset to empty if we're not in completed state
      setState(prev => prev.type === "completed" ? prev : { type: "empty" });
      return;
    }

    if (job) {
      if (job.status === "PROCESSING" || job.status === "PENDING") {
        setState({ type: "processing", stage: job.currentStage });
      } else if (job.status === "COMPLETED" && job.enhancedUrl) {
        setState({
          type: "completed",
          result: {
            jobId: job.id,
            resultUrl: job.enhancedUrl,
            width: job.enhancedWidth || 1024,
            height: job.enhancedHeight || 1024,
          },
        });
      } else if (job.status === "FAILED") {
        setState({
          type: "failed",
          error: job.errorMessage || "Mix failed",
        });
      }
    } else {
      // Job ID is set but job data not yet received
      setState({ type: "processing", stage: null });
    }
  }, [activeJobId, job]);

  const handleDownload = useCallback(async () => {
    if (state.type !== "completed") return;

    try {
      const response = await fetch(state.result.resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mix-${state.result.jobId}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error("Failed to download mix result", error);
    }
  }, [state]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        "aspect-square w-full",
        "glass-2 border border-white/10",
        "flex flex-col items-center justify-center",
        className,
      )}
    >
      {state.type === "empty" && (
        <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
            <Layers className="h-8 w-8 text-white/40" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-white/70">
              Generated Blend
            </p>
          </div>
        </div>
      )}

      {state.type === "processing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20">
            </div>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <div className="space-y-2 text-center z-10">
            <p className="text-lg font-medium text-white shadow-black/50 drop-shadow-md">
              Mixing your blend...
            </p>
            {/* Stage indicator could go here */}
          </div>
          {/* Background effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 animate-pulse pointer-events-none" />
        </div>
      )}

      {state.type === "completed" && (
        <>
          <Image
            src={state.result.resultUrl}
            alt="Mix result"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {/* Action buttons overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Button
              size="lg"
              variant="default"
              onClick={handleDownload}
              className="w-full shadow-lg bg-white text-black hover:bg-white/90 font-semibold"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Result
            </Button>
          </div>
        </>
      )}

      {state.type === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center border border-destructive/50">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-destructive">
              Blend Failed
            </p>
            <p className="text-sm text-white/60">
              {state.error}
            </p>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="mt-4 border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
