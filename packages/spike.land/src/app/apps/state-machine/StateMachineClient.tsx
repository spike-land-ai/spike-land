"use client";

import dynamic from "next/dynamic";
import { ErrorBoundary } from "react-error-boundary";
import type { FallbackProps } from "react-error-boundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const DynamicStateMachineApp = dynamic(
  () => import("./StateMachineApp").then(m => ({ default: m.StateMachineApp })),
  { ssr: false },
);

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-red-950/20 border border-red-900/50 rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-red-400 max-w-sm mx-auto break-words bg-black/20 p-3 rounded-lg border border-red-500/10">
            {error instanceof Error
              ? error.message
              : "Will reload the application."}
          </p>
        </div>
        <Button
          onClick={resetErrorBoundary}
          className="bg-red-600 hover:bg-red-700 text-white w-full transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Application
        </Button>
      </div>
    </div>
  );
}

export function StateMachineApp() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <DynamicStateMachineApp />
    </ErrorBoundary>
  );
}
