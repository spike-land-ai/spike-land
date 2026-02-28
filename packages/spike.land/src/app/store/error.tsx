"use client";

import { reportErrorBoundary } from "@/lib/errors/console-capture.client";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StoreError({ error, reset }: ErrorProps) {
  useEffect(() => {
    reportErrorBoundary(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 text-5xl" aria-hidden="true">&#x26A0;&#xFE0F;</div>
      <h1 className="mb-2 text-2xl font-bold">
        App Store Unavailable
      </h1>
      <p className="mb-8 text-muted-foreground max-w-md">
        The App Store encountered an error. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
