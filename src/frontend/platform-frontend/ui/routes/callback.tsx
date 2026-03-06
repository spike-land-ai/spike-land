import { useEffect } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAuth } from "../hooks/useAuth";

export function CallbackPage() {
  const { trackEvent } = useAnalytics();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) trackEvent("signup_completed");
  }, [isAuthenticated, trackEvent]);

  // Better Auth handles OAuth callbacks server-side at /api/auth/callback/{provider}
  return <Navigate to="/" />;
}
