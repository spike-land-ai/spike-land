/**
 * NextAuth Configuration (Full - for route handlers)
 *
 * This file contains the full NextAuth configuration including database operations.
 * It extends the Edge-compatible config from auth.config.ts.
 * This file is used by route handlers (NOT middleware) for authentication.
 *
 * The signIn callback creates/updates users with stable IDs in the database.
 */

import { PrismaAdapter } from "@auth/prisma-adapter";
import { ensureUserAlbums } from "@/lib/albums/ensure-user-albums";
import { bootstrapAdminIfNeeded } from "@/lib/auth/bootstrap-admin";
import { completeQRAuth } from "@/lib/auth/qr-auth-service";
import { logger } from "@/lib/errors/structured-logger";
import { MagicLinkEmail } from "@/lib/email/templates/magic-link";
import { sendEmail } from "@/lib/email/client";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { attributeConversion } from "@/lib/tracking/attribution";
import { tryCatch } from "@/lib/try-catch";
import { ensurePersonalWorkspace } from "@/lib/workspace/ensure-personal-workspace";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { DefaultSession } from "next-auth";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import type { EmailConfig } from "next-auth/providers/email";
import { secureCompare } from "@/lib/security/timing";
import { authConfig, createStableUserId } from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    /** Set to true after we confirm user exists in DB — prevents repeated lookups */
    _dbOk?: boolean;
  }
}

/**
 * Handles user creation/update with stable ID during sign-in.
 * Also processes referral tracking and rewards.
 * Exported for testing purposes.
 *
 * @param user - The user object from OAuth provider
 * @returns true to allow sign-in to proceed
 */
export async function handleSignIn(user: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<boolean> {
  // Create or update user with stable ID based on email
  // This runs before NextAuth creates a user with random CUID
  if (user.email) {
    const stableId = createStableUserId(user.email);

    // Check if user already exists
    const { data: existingUser, error: findError } = await tryCatch(
      prisma.user.findUnique({
        where: { email: user.email },
      }),
    );

    if (findError) {
      // Log the error but don't block sign-in
      // The JWT callback will still set the correct stable ID, so the user
      // can authenticate. The database record will be created on next sign-in.
      logger.error(
        "Failed to upsert user with stable ID",
        findError instanceof Error ? findError : undefined,
        { route: "/api/auth" },
      );
      return true;
    }

    const isNewUser = !existingUser;

    // Use upsert to handle both new and existing users
    const { data: upsertedUser, error: upsertError } = await tryCatch(
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          // Update profile info if user already exists
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        },
        create: {
          id: stableId,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      }),
    );

    if (upsertError) {
      // Log the error but don't block sign-in
      // The JWT callback will still set the correct stable ID, so the user
      // can authenticate. The database record will be created on next sign-in.
      logger.error(
        "Failed to upsert user with stable ID",
        upsertError instanceof Error ? upsertError : undefined,
        { route: "/api/auth" },
      );
      // Return true to allow sign-in to proceed since:
      // 1. JWT callback sets the correct stable ID regardless
      // 2. User can still authenticate even if DB is temporarily down
      // 3. The record will be created on next successful sign-in
      return true;
    }

    // Ensure personal workspace exists on every sign-in (idempotent).
    // This self-heals users whose workspace creation failed on first sign-in.
    const { error: workspaceError } = await tryCatch(
      ensurePersonalWorkspace(upsertedUser.id, upsertedUser.name),
    );
    if (workspaceError) {
      logger.error(
        "Failed to ensure personal workspace",
        workspaceError instanceof Error ? workspaceError : undefined,
        { route: "/api/auth" },
      );
    }

    // Handle referral tracking and one-time setup for new users
    if (isNewUser) {
      // Bootstrap admin role for first user
      const { error: bootstrapError } = await tryCatch(
        bootstrapAdminIfNeeded(upsertedUser.id),
      );
      if (bootstrapError) {
        logger.error(
          "Failed to bootstrap admin",
          bootstrapError instanceof Error ? bootstrapError : undefined,
          { route: "/api/auth" },
        );
      }

      /*
      // Assign referral code to new user
      const { error: referralCodeError } = await tryCatch(
        assignReferralCodeToUser(upsertedUser.id),
      );
      if (referralCodeError) {
        console.error("Failed to assign referral code:", referralCodeError);
      }

      // Link referral if cookie exists
      const { error: linkReferralError } = await tryCatch(
        linkReferralOnSignup(upsertedUser.id),
      );
      if (linkReferralError) {
        console.error("Failed to link referral on signup:", linkReferralError);
      }
      */

      // Create default private and public albums
      const { error: albumsError } = await tryCatch(
        ensureUserAlbums(upsertedUser.id),
      );
      if (albumsError) {
        logger.error(
          "Failed to create default albums",
          albumsError instanceof Error ? albumsError : undefined,
          { route: "/api/auth" },
        );
      }

      // Track signup conversion attribution for campaign analytics
      const { error: attributionError } = await tryCatch(
        attributeConversion(upsertedUser.id, "SIGNUP"),
      );
      if (attributionError) {
        logger.error(
          "Failed to track signup attribution",
          attributionError instanceof Error ? attributionError : undefined,
          { route: "/api/auth" },
        );
      }
    }

    /*
    // Process referral rewards if email is verified (for OAuth, it's auto-verified)
    if (user.email && isNewUser) {
      const { data: validation, error: validationError } = await tryCatch(
        validateReferralAfterVerification(upsertedUser.id),
      );

      if (validationError) {
        console.error("Failed to validate referral:", validationError);
      } else if (validation?.shouldGrantRewards && validation.referralId) {
        const { error: rewardsError } = await tryCatch(
          completeReferralAndGrantRewards(validation.referralId),
        );
        if (rewardsError) {
          console.error("Failed to grant referral rewards:", rewardsError);
        }
      }
    }
    */
  }
  return true;
}

import { cookies, headers } from "next/headers";

const {
  handlers,
  signIn,
  signOut,
  auth: originalAuth,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  // Add Credentials provider for email/password login (primarily for testing)
  providers: [
    ...authConfig.providers,
    {
      id: "email",
      type: "email",
      name: "Email",
      from: process.env.EMAIL_FROM || "noreply@spike.land",
      maxAge: 10 * 60, // 10 minutes
      async sendVerificationRequest({ identifier: email, url }) {
        const host = new URL(url).host;
        await sendEmail({
          to: email,
          subject: `Sign in to ${host}`,
          react: MagicLinkEmail({ url, host }),
        });
      },
      options: {},
    } satisfies EmailConfig,
    Credentials({
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "test@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Reject oversized inputs before any DB or bcrypt work.
        // RFC 5321 caps email at 254 chars; bcryptjs silently truncates passwords
        // at 72 bytes so an explicit cap prevents surprises and reduces DoS surface.
        const MAX_EMAIL_LENGTH = 254;
        const MAX_PASSWORD_LENGTH = 1024;
        if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
          return null;
        }

        // Rate limit login attempts per email (5 attempts per 15 minutes)
        const rateLimitResult = await checkRateLimit(
          `login:${email.toLowerCase()}`,
          {
            maxRequests: 5,
            windowMs: 15 * 60 * 1000, // 15 minutes
          },
        );

        if (rateLimitResult.isLimited) {
          logger.warn(`Rate limited login attempt`, {
            email,
            route: "/api/auth",
          });
          return null;
        }

        // Find user by email
        const { data: user, error: findUserError } = await tryCatch(
          prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              passwordHash: true,
            },
          }),
        );

        if (findUserError) {
          logger.error(
            "Credentials auth error",
            findUserError instanceof Error ? findUserError : undefined,
            { route: "/api/auth" },
          );
          return null;
        }

        // Pre-computed dummy hash for timing attack prevention.
        // This ensures bcrypt.compare always runs the full cost-10 computation
        // regardless of whether the user exists, preventing user-enumeration
        // via timing. IMPORTANT: must be a valid 60-character bcrypt hash —
        // an invalid hash causes bcryptjs to short-circuit and return false
        // immediately, eliminating the timing protection.
        const dummyHash = "$2b$10$RS/24gZTIvrY5lSNhskfN.9y8tEDqwUwsQHuv0zQSNlSCwnhBiLju";

        // Always run bcrypt comparison to prevent timing attacks
        const hashToCompare = user?.passwordHash || dummyHash;
        const { data: isValidPassword, error: bcryptError } = await tryCatch(
          bcrypt.compare(password, hashToCompare),
        );

        if (bcryptError) {
          logger.error(
            "Credentials auth error",
            bcryptError instanceof Error ? bcryptError : undefined,
            { route: "/api/auth" },
          );
          return null;
        }

        // Return null if user doesn't exist, has no password, or password is invalid
        if (!user || !user.passwordHash || !isValidPassword) {
          return null;
        }

        // Return user object (NextAuth will use this)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "qr-auth",
      name: "QR Code",
      credentials: {
        qrHash: { label: "QR Hash", type: "text" },
        qrOneTimeCode: { label: "One-time Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.qrHash || !credentials?.qrOneTimeCode) {
          return null;
        }

        const hash = credentials.qrHash as string;
        const oneTimeCode = credentials.qrOneTimeCode as string;

        const userId = await completeQRAuth(hash, oneTimeCode);
        if (!userId) return null;

        // Look up the user from the database
        const { data: user, error } = await tryCatch(
          prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, image: true },
          }),
        );

        if (error || !user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  // Debug mode disabled - enable manually with AUTH_DEBUG=true if needed
  debug: process.env.AUTH_DEBUG === "true",
  // Custom logger to capture auth errors in production
  // NextAuth v5 logger signature: (code, ...message) for all methods
  logger: {
    error(code, ...message) {
      logger.error(`NextAuth error: ${code}`, undefined, {
        route: "/api/auth",
        details: message,
      });
    },
    warn(code, ...message) {
      logger.warn(`NextAuth warning: ${code}`, {
        route: "/api/auth",
        details: message,
      });
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        logger.debug(`NextAuth debug: ${code}`, {
          route: "/api/auth",
          details: message,
        });
      }
    },
  },
  // Track auth events for monitoring and debugging
  events: {
    signIn: ({ user, account }) => {
      logger.info("User signed in", {
        userId: user.id,
        provider: account?.provider,
        route: "/api/auth",
      });
    },
    signOut: message => {
      // Handle both token and session based signOut
      // JWT strategy uses token, database strategy uses session
      const identifier = "token" in message ? message.token?.sub : undefined;
      logger.info("User signed out", {
        userId: identifier,
        route: "/api/auth",
      });
    },
    createUser: ({ user }) => {
      logger.info("New user created via auth", {
        userId: user.id,
        route: "/api/auth",
      });
    },
    linkAccount: ({ user, account }) => {
      logger.info("Account linked", {
        userId: user.id,
        provider: account.provider,
        route: "/api/auth",
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // For credentials provider, ensure workspace exists but skip full handleSignIn.
      // User already exists in DB (created via /api/auth/signup), but workspace
      // creation may have failed during signup — this self-heals on every sign-in.
      if (account?.provider === "credentials") {
        if (user.email) {
          const stableId = createStableUserId(user.email);
          const { error } = await tryCatch(
            ensurePersonalWorkspace(stableId, user.name),
          );
          if (error) {
            logger.error(
              "Failed to ensure workspace for credentials user",
              error instanceof Error ? error : undefined,
              { route: "/api/auth" },
            );
          }
        }
        return true;
      }
      if (account?.provider === "qr-auth") {
        // QR auth - user already exists, ensure workspace
        if (user.email) {
          const stableId = createStableUserId(user.email);
          const { error } = await tryCatch(ensurePersonalWorkspace(stableId, user.name));
          if (error) {
            logger.error(
              "Failed to ensure workspace for QR auth user",
              error instanceof Error ? error : undefined,
              { route: "/api/auth" },
            );
          }
        }
        return true;
      }
      // For Email provider, run the full handleSignIn flow
      if (account?.provider === "email") {
        return handleSignIn(user);
      }
      // For OAuth providers (GitHub, Google), run normal handleSignIn flow
      return handleSignIn(user);
    },
    async jwt({ token, user, trigger }): Promise<JWT> {
      // Call base jwt callback for stable ID handling
      const baseCallbacks = authConfig.callbacks;
      if (baseCallbacks?.jwt) {
        const result = await baseCallbacks.jwt(
          {
            token,
            user,
            trigger,
          } as Parameters<typeof baseCallbacks.jwt>[0],
        );
        if (result) {
          token = result;
        }
      }

      // Verify user exists in DB and fetch role.
      // Runs on: sign-in events, update trigger, OR first request for unverified tokens.
      // The _dbOk flag prevents repeated DB lookups on every request.
      const shouldCheckDb = user?.email || trigger === "signIn"
        || trigger === "update" || !token._dbOk;
      if (shouldCheckDb) {
        const userId = token.sub;
        if (userId) {
          const { data: dbUser, error: roleError } = await tryCatch(
            prisma.user.findUnique({
              where: { id: userId },
              select: { role: true },
            }),
          );
          if (roleError) {
            logger.error(
              "Failed to fetch user role for JWT",
              roleError instanceof Error ? roleError : undefined,
              { route: "/api/auth" },
            );
            // Default to USER role if database lookup fails
            if (!token.role) {
              token.role = UserRole.USER;
            }
            // Don't set _dbOk so we retry on next request
          } else if (dbUser) {
            token.role = dbUser.role;
            token._dbOk = true;
          } else if (token.email) {
            // Self-heal: user has valid JWT but no DB record ("ghost user").
            // This happens when handleSignIn's DB upsert fails due to transient errors
            // but sign-in is allowed to proceed (returns true for resilience).
            logger.warn(`Self-healing ghost user`, {
              email: token.email,
              userId,
              route: "/api/auth",
            });
            const { data: healedUser, error: healError } = await tryCatch(
              prisma.user.upsert({
                where: { email: token.email as string },
                update: {
                  name: (token.name as string) ?? undefined,
                  image: (token.picture as string) ?? undefined,
                },
                create: {
                  id: userId,
                  email: token.email as string,
                  name: (token.name as string) ?? undefined,
                  image: (token.picture as string) ?? undefined,
                },
              }),
            );
            if (healError) {
              logger.error(
                "Self-heal failed",
                healError instanceof Error ? healError : undefined,
                { route: "/api/auth" },
              );
            } else if (healedUser) {
              token.role = healedUser.role;
              token._dbOk = true;
              // Run post-signup tasks for the healed user
              await tryCatch(bootstrapAdminIfNeeded(healedUser.id));
              await tryCatch(ensureUserAlbums(healedUser.id));
              await tryCatch(
                ensurePersonalWorkspace(healedUser.id, healedUser.name),
              );
            }
          }
        }
      }

      // Ensure role has a default value
      if (!token.role) {
        token.role = UserRole.USER;
      }

      return token;
    },
    session({ session, token }) {
      // Copy ID and role from token to session
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role;
      } else if (session.user) {
        session.user.role = UserRole.USER;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

/**
 * Helper to create mock session for E2E testing.
 * Extracts user info from cookies or uses defaults.
 */
async function getMockE2ESession() {
  const { data: cookieStore } = await tryCatch(cookies());
  // Validate role against UserRole enum to prevent type assertion bypass
  const roleValue = cookieStore?.get("e2e-user-role")?.value;
  const validRoles = Object.values(UserRole);
  let role = validRoles.includes(roleValue as UserRole)
    ? (roleValue as UserRole)
    : UserRole.USER;
  const email = cookieStore?.get("e2e-user-email")?.value || "test@example.com";
  const name = cookieStore?.get("e2e-user-name")?.value || "Test User";

  // Map known test emails to seeded IDs
  let id = "test-user-id";
  if (email === "admin@example.com") {
    id = "admin-user-id";
    role = UserRole.ADMIN;
  } else if (
    email === "newuser@example.com"
    || email === "no-orders@example.com"
  ) {
    // User ID that has no orders in E2E seed data - for testing empty states
    id = "new-user-id";
  }

  return {
    user: {
      id,
      name,
      email,
      image: null,
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export const auth = async () => {
  // Check for E2E bypass via env var FIRST (local dev with yarn dev:e2e)
  // This is checked first because it's faster (no headers() call needed if bypassing)
  if (process.env.E2E_BYPASS_AUTH === "true") {
    logger.debug("[Auth] E2E_BYPASS_AUTH is enabled", { route: "/api/auth" });
    const { data: cookieStore } = await tryCatch(cookies());
    // Check for mock session token cookie
    if (cookieStore) {
      const sessionToken = cookieStore.get("authjs.session-token")?.value;
      if (sessionToken === "mock-session-token") {
        logger.debug(
          "[Auth] E2E bypass: Mock session token found, returning mock session",
          { route: "/api/auth" },
        );
        return getMockE2ESession();
      }
    }

    // In E2E mode without mock session, return null (unauthenticated)
    // This prevents hanging on database connections during E2E tests
    logger.debug("[Auth] E2E bypass: No mock session token, returning null", {
      route: "/api/auth",
    });
    return null;
  }

  // Check for E2E bypass via header (works on Vercel previews)
  // This is the primary bypass mechanism for CI/CD
  // SECURITY: Only enabled in non-production environments
  // Staging (next.spike.land) is allowed to use E2E bypass for smoke tests
  const { data: headersList } = await tryCatch(headers());
  // Use environment variable for domain check to prevent Host header injection
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const isStagingDomain = appUrl === "https://next.spike.land"
    || appUrl.includes("localhost");
  const isProduction = process.env.NODE_ENV === "production"
    && process.env.APP_ENV === "production"
    && !isStagingDomain;
  const e2eBypassSecret = process.env.E2E_BYPASS_SECRET;

  if (!isProduction && e2eBypassSecret) {
    const bypassHeader = headersList?.get("x-e2e-auth-bypass");

    if (bypassHeader && secureCompare(bypassHeader, e2eBypassSecret)) {
      return getMockE2ESession();
    } else if (bypassHeader) {
      logger.error(
        "[Auth] E2E bypass FAILED: Header present but does not match secret",
        undefined,
        { route: "/api/auth" },
      );
    }
  } else {
    if (isProduction) {
      logger.debug("[Auth] E2E bypass disabled: Production environment", {
        route: "/api/auth",
      });
    } else if (!e2eBypassSecret) {
      logger.warn(
        "[Auth] E2E bypass disabled: E2E_BYPASS_SECRET not configured",
        { route: "/api/auth" },
      );
    }
  }

  return originalAuth();
};
export { handlers, signIn, signOut };

// Export for use in data migration
export { createStableUserId };
