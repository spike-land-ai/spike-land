import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { trackAnalyticsEvent } from "../hooks/useAnalytics";

export function ThankYouPage() {
  useEffect(() => {
    trackAnalyticsEvent("thank_you_page_view", { page: "/thank-you" });
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-5xl">
        🙌
      </div>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
        Success
      </p>
      <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tighter leading-[0.9] mb-6">
        Thank you!
      </h1>
      <p className="text-lg text-muted-foreground font-medium max-w-md mb-12 leading-relaxed">
        Your support means the world. We appreciate you being part of the spike.land community.
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Next steps">
        <Link
          to="/"
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
        <Link
          to="/apps"
          className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:border-primary/30 transition-colors"
        >
          Browse Apps
        </Link>
        <Link
          to="/blog"
          className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:border-primary/30 transition-colors"
        >
          Read the Blog
        </Link>
        <Link
          to="/dashboard"
          className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:border-primary/30 transition-colors"
        >
          Your Dashboard
        </Link>
      </nav>
    </div>
  );
}
