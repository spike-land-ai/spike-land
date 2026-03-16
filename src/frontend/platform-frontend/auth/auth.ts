import { createAuthClient } from "better-auth/react";
import { API_BASE } from "../core-logic/api";

export const authClient = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: {
    credentials: "include" as const,
  },
});

export const authProviders = [
  { id: "github", name: "GitHub", icon: "github" },
  { id: "google", name: "Google", icon: "google" },
] as const;

export type AuthProvider = (typeof authProviders)[number];
