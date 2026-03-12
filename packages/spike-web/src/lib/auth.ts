import { createAuthClient } from "better-auth/client";

function getBaseURL(): string {
  if (typeof window === "undefined") return "https://api.spike.land";

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8787";
  }

  if (hostname === "local.spike.land") {
    return "https://local.spike.land:8787";
  }

  return "https://api.spike.land";
}

export const authClient = createAuthClient({ baseURL: getBaseURL() });
export const apiBaseURL = getBaseURL();
