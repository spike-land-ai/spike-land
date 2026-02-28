"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Not-found handler for /create/* routes.
 * Redirects unknown /create/<path> to /g/<path> for AI generation.
 */
export default function CreateNotFound() {
  const router = useRouter();

  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    // Strip /create prefix and redirect to /g/
    const subpath = path.replace(/^\/create\/?/, "");
    if (subpath) {
      router.replace(`/g/${subpath}`);
    } else {
      router.replace("/g");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
