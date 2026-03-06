import { useEffect } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAnalytics } from "../hooks/useAnalytics";

export function CallbackPage() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent("signup_completed");
  }, [trackEvent]);

  // Better Auth handles OAuth callbacks server-side at /api/auth/callback/{provider}
  return <Navigate to="/" />;
}
