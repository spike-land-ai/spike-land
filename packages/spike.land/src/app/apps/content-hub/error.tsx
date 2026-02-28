"use client";

import { reportErrorBoundary } from "@/lib/errors/console-capture.client";
import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ContentHubError({ error, reset }: ErrorProps) {
  useEffect(() => {
    reportErrorBoundary(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 text-5xl" aria-hidden="true">&#x1F4DD;</div>
      <h1 className="mb-2 text-2xl font-bold">Content Hub Unavailable</h1>
      <p className="mb-8 text-muted-foreground max-w-md">
        The Content Hub encountered an error. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/store"
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Back to Store
        </Link>
      </div>
    </div>
  );
}
