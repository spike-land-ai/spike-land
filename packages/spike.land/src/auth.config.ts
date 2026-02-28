/**
 * NextAuth Configuration (Edge-compatible)
 *
 * This file contains the Edge-compatible NextAuth configuration.
 * It does NOT import prisma or any Node.js-only modules.
 * Used by middleware for authentication checks.
 *
 * Database operations are handled in auth.ts (route handlers only).
 */

import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Creates a stable user ID based on email address.
 * This ensures the same user gets the same ID regardless of OAuth provider.
 * Uses a simple hash for Edge runtime compatibility.
 *
 * Uses USER_ID_SALT (preferred) or falls back to AUTH_SECRET.
 * USER_ID_SALT should never be rotated as it would change all user IDs.
 * Using a dedicated salt allows AUTH_SECRET to be rotated for security.
 *
 * IMPORTANT: User IDs are tied to email addresses. If a user changes their
 * email address (at the OAuth provider level), they will get a new user ID
 * and lose access to their previous data. This is by design to maintain
 * the 1:1 relationship between email and user identity.
 */
export function createStableUserId(email: string): string {
  const salt = process.env.USER_ID_SALT || process.env.AUTH_SECRET;
  if (!salt) {
    throw new Error(
      "USER_ID_SALT or AUTH_SECRET environment variable must be set for stable user IDs",
    );
  }
  // Use simple hash for Edge runtime compatibility
  // Combines salt + email and creates a deterministic hash
  const input = `${salt}:${email.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and pad to ensure consistent length
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
  // Add more entropy by hashing again with different positions
  let hash2 = 0;
  for (let i = input.length - 1; i >= 0; i--) {
    const char = input.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  const hexHash2 = Math.abs(hash2).toString(16).padStart(8, "0");
  return `user_${hexHash}${hexHash2}${hexHash}${hexHash2}`;
}

/**
 * NextAuth configuration for Edge runtime (middleware).
 * Does not include database operations.
 */
const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authConfig = {
  // Trust the host when running behind a proxy (required for Vercel, Cloudflare, etc.)
  // This allows NextAuth to correctly handle X-Forwarded-Host headers
  trustHost: true,
  // Explicit cookie configuration for Safari ITP compatibility
  // Safari's Intelligent Tracking Prevention in incognito mode blocks cookies aggressively
  // Using sameSite: "lax" and explicit maxAge improves compatibility
  cookies: {
    pkceCodeVerifier: {
      name: `${cookiePrefix}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `${cookiePrefix}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  providers: [
    ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET
      ? [Apple({
        clientId: process.env.AUTH_APPLE_ID.trim(),
        clientSecret: process.env.AUTH_APPLE_SECRET.trim(),
      })]
      : []),
    ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? [Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID.trim(),
        clientSecret: process.env.AUTH_FACEBOOK_SECRET.trim(),
      })]
      : []),
    // GitHub and Google are only registered when both client ID and secret are
    // present. Passing empty strings to NextAuth v5 causes `invalid_client`
    // errors at runtime; omitting the provider entirely fails gracefully.
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [GitHub({
        clientId: process.env.GITHUB_ID.trim(),
        clientSecret: process.env.GITHUB_SECRET.trim(),
      })]
      : []),
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [Google({
        clientId: process.env.GOOGLE_ID.trim(),
        clientSecret: process.env.GOOGLE_SECRET.trim(),
      })]
      : []),
  ],
  callbacks: {
    session({ session, token }: { session: Session; token: JWT; }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }: { token: JWT; user?: User; }) {
      if (user?.email) {
        // Use stable ID based on email (same across all OAuth providers)
        token.sub = createStableUserId(user.email);
      } else if (user?.id) {
        // Fallback for users without email - use provider ID with prefix
        token.sub = `provider_${user.id}`;
      }
      // If neither email nor id exists, token.sub remains from previous JWT
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
  },
};
