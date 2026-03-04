"use client";

/**
 * Client-side auth actions facade.
 *
 * Re-exports signIn/signOut so client components import
 * from `@/lib/auth/client` instead of `next-auth/react`.
 */

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth/client";

export type SignInProvider =
  | "github"
  | "google"
  | "apple"
  | "facebook"
  | "email"
  | "qr-auth"
  | "credentials";

interface SignInOptions {
  callbackUrl?: string;
  redirect?: boolean;
  [key: string]: unknown;
}

interface SignOutOptions {
  callbackUrl?: string;
  fetchOptions?: Record<string, unknown>;
}

/**
 * Trigger a sign-in flow.
 */
export async function signIn(provider?: SignInProvider, options?: SignInOptions) {
  return nextAuthSignIn(provider || "email", options);
}

/**
 * Trigger a sign-out flow.
 */
export async function signOut(options?: SignOutOptions) {
  const result = await nextAuthSignOut(
    options?.fetchOptions ? { fetchOptions: options.fetchOptions } : undefined,
  );
  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl;
  }
  return result;
}
