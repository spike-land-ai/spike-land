import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCheckRateLimit = vi.hoisted(() => vi.fn());
vi.mock("@/lib/rate-limiter", () => ({ checkRateLimit: mockCheckRateLimit }));

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
  default: undefined as unknown,
}));
mockPrisma.default = mockPrisma;
vi.mock("@/lib/prisma", () => mockPrisma);

vi.mock(
  "@/auth.config",
  () => ({ createStableUserId: vi.fn().mockReturnValue("stable-id") }),
);
vi.mock(
  "@/lib/albums/ensure-user-albums",
  () => ({ ensureUserAlbums: vi.fn() }),
);
vi.mock(
  "@/lib/auth/bootstrap-admin",
  () => ({ bootstrapAdminIfNeeded: vi.fn() }),
);
vi.mock(
  "@/lib/workspace/ensure-personal-workspace",
  () => ({ ensurePersonalWorkspace: vi.fn() }),
);
vi.mock(
  "@/lib/try-catch",
  () => ({
    tryCatch: vi.fn(async (p: Promise<unknown>) => {
      try {
        return { data: await p, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    }),
  }),
);
vi.mock(
  "bcryptjs",
  () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }),
);
vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock("@/lib/security/ip", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

import { POST } from "./route";

function makeRequest(
  body: Record<string, unknown>,
  options: { contentLength?: string } = {},
) {
  const headers = new Headers({
    "content-length": options.contentLength ?? "100",
  });
  return {
    headers,
    json: () => Promise.resolve(body),
  } as unknown as import("next/server").NextRequest;
}

function setupOpenRegistration() {
  vi.stubEnv("REGISTRATION_OPEN", "true");
}

function makeSuccessfulUser() {
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.create.mockResolvedValue({
    id: "stable-id",
    email: "user@example.com",
    name: null,
  });
}

describe("signup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockCheckRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 4,
      resetAt: 0,
    });
  });

  // -------------------------------------------------------------------------
  // REGISTRATION_OPEN gate
  // -------------------------------------------------------------------------
  describe("REGISTRATION_OPEN gate", () => {
    it("returns 503 when REGISTRATION_OPEN env var is not set", async () => {
      delete process.env.REGISTRATION_OPEN;
      const res = await POST(
        makeRequest({ email: "a@b.com", password: "12345678" }),
      );
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toMatch(/registration is temporarily closed/i);
      expect(data.waitlistUrl).toBe("/waitlist");
    });

    it("returns 503 when REGISTRATION_OPEN is set to 'false'", async () => {
      vi.stubEnv("REGISTRATION_OPEN", "false");
      const res = await POST(
        makeRequest({ email: "a@b.com", password: "12345678" }),
      );
      expect(res.status).toBe(503);
    });

    it("returns 503 when REGISTRATION_OPEN is set to '1' (not exactly 'true')", async () => {
      vi.stubEnv("REGISTRATION_OPEN", "1");
      const res = await POST(
        makeRequest({ email: "a@b.com", password: "12345678" }),
      );
      expect(res.status).toBe(503);
    });

    it("does not call rate limiter or DB when registration is closed", async () => {
      delete process.env.REGISTRATION_OPEN;
      await POST(makeRequest({ email: "a@b.com", password: "12345678" }));
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Request payload size limit
  // -------------------------------------------------------------------------
  describe("request size limit", () => {
    it("returns 413 when content-length exceeds 2048 bytes", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest(
          { email: "a@b.com", password: "12345678" },
          { contentLength: "9999" },
        ),
      );
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toMatch(/too large/i);
    });

    it("allows requests at exactly the 2048 byte limit", async () => {
      setupOpenRegistration();
      makeSuccessfulUser();
      const res = await POST(
        makeRequest(
          { email: "user@example.com", password: "12345678" },
          { contentLength: "2048" },
        ),
      );
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------
  describe("rate limiting", () => {
    it("returns 429 when rate limit is exceeded", async () => {
      setupOpenRegistration();
      const resetAt = Date.now() + 60_000;
      mockCheckRateLimit.mockResolvedValue({
        isLimited: true,
        remaining: 0,
        resetAt,
      });

      const res = await POST(
        makeRequest({ email: "a@b.com", password: "12345678" }),
      );
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toMatch(/too many signup attempts/i);
    });

    it("includes Retry-After header when rate limited", async () => {
      setupOpenRegistration();
      const resetAt = Date.now() + 30_000;
      mockCheckRateLimit.mockResolvedValue({
        isLimited: true,
        remaining: 0,
        resetAt,
      });

      const res = await POST(
        makeRequest({ email: "a@b.com", password: "12345678" }),
      );
      expect(res.status).toBe(429);
      const retryAfter = res.headers.get("Retry-After");
      expect(retryAfter).toBeDefined();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });

    it("includes X-RateLimit-Remaining header when rate limited", async () => {
      setupOpenRegistration();
      mockCheckRateLimit.mockResolvedValue({
        isLimited: true,
        remaining: 0,
        resetAt: Date.now() + 10_000,
      });

      const res = await POST(
        makeRequest({ email: "a@b.com", password: "12345678" }),
      );
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("does not check DB when rate limited", async () => {
      setupOpenRegistration();
      mockCheckRateLimit.mockResolvedValue({
        isLimited: true,
        remaining: 0,
        resetAt: Date.now() + 10_000,
      });
      await POST(makeRequest({ email: "a@b.com", password: "12345678" }));
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Email validation
  // -------------------------------------------------------------------------
  describe("email validation", () => {
    it("returns 400 when email is missing", async () => {
      setupOpenRegistration();
      const res = await POST(makeRequest({ password: "12345678" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/email is required/i);
    });

    it("returns 400 when email is not a string", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest({ email: 12345, password: "12345678" }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/email is required/i);
    });

    it("returns 400 for invalid email format — missing @", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest({ email: "notanemail", password: "12345678" }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/invalid email format/i);
    });

    it("returns 400 for invalid email format — missing domain", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest({ email: "user@", password: "12345678" }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/invalid email format/i);
    });

    it("accepts valid email with subdomains", async () => {
      setupOpenRegistration();
      makeSuccessfulUser();
      mockPrisma.user.create.mockResolvedValue({
        id: "stable-id",
        email: "user@mail.example.co.uk",
        name: null,
      });
      const res = await POST(
        makeRequest({ email: "user@mail.example.co.uk", password: "12345678" }),
      );
      expect(res.status).toBe(200);
    });

    it("normalises email to lowercase before storage", async () => {
      setupOpenRegistration();
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "stable-id",
        email: "user@example.com",
        name: null,
      });

      await POST(
        makeRequest({ email: "  USER@EXAMPLE.COM  ", password: "12345678" }),
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "user@example.com" },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Password validation
  // -------------------------------------------------------------------------
  describe("password validation", () => {
    it("returns 400 when password is missing", async () => {
      setupOpenRegistration();
      const res = await POST(makeRequest({ email: "a@b.com" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/password is required/i);
    });

    it("returns 400 when password is not a string", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest({ email: "a@b.com", password: 12345678 }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/password is required/i);
    });

    it("returns 400 when password is shorter than 8 characters", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest({ email: "a@b.com", password: "short" }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/at least 8 characters/i);
    });

    it("returns 400 for a 7-character password (boundary condition)", async () => {
      setupOpenRegistration();
      const res = await POST(
        makeRequest({ email: "a@b.com", password: "1234567" }),
      );
      expect(res.status).toBe(400);
    });

    it("accepts an 8-character password (minimum boundary)", async () => {
      setupOpenRegistration();
      makeSuccessfulUser();
      const res = await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // Duplicate user detection
  // -------------------------------------------------------------------------
  describe("duplicate email detection", () => {
    it("returns 409 when a user with the same email already exists", async () => {
      setupOpenRegistration();
      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-id" });

      const res = await POST(
        makeRequest({ email: "existing@example.com", password: "12345678" }),
      );
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toMatch(/already exists/i);
    });

    it("checks the normalised (lowercased) email against the DB", async () => {
      setupOpenRegistration();
      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-id" });

      await POST(
        makeRequest({ email: "EXISTING@EXAMPLE.COM", password: "12345678" }),
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "existing@example.com" },
        }),
      );
    });

    it("does not call prisma.user.create when user already exists", async () => {
      setupOpenRegistration();
      mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-id" });

      await POST(
        makeRequest({ email: "existing@example.com", password: "12345678" }),
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Successful signup flow
  // -------------------------------------------------------------------------
  describe("success flow", () => {
    beforeEach(() => {
      setupOpenRegistration();
      makeSuccessfulUser();
    });

    it("returns 200 with success payload on valid signup", async () => {
      const res = await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toMatch(/account created/i);
      expect(data.user.email).toBe("user@example.com");
      expect(data.user.id).toBe("stable-id");
    });

    it("does not expose passwordHash in the response", async () => {
      const res = await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      const data = await res.json();
      expect(data.user).not.toHaveProperty("passwordHash");
      expect(data.user).not.toHaveProperty("password");
    });

    it("hashes the password with bcrypt before storing", async () => {
      const bcrypt = await import("bcryptjs");
      await POST(
        makeRequest({ email: "user@example.com", password: "plaintext" }),
      );
      expect(bcrypt.default.hash).toHaveBeenCalledWith("plaintext", 12);
    });

    it("creates the user with the hashed password", async () => {
      await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: "hashed" }),
        }),
      );
    });

    it("calls bootstrapAdminIfNeeded after user creation", async () => {
      const { bootstrapAdminIfNeeded } = await import(
        "@/lib/auth/bootstrap-admin"
      );
      await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(bootstrapAdminIfNeeded).toHaveBeenCalledWith("stable-id");
    });

    it("calls ensureUserAlbums after user creation", async () => {
      const { ensureUserAlbums } = await import(
        "@/lib/albums/ensure-user-albums"
      );
      await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(ensureUserAlbums).toHaveBeenCalledWith("stable-id");
    });

    it("calls ensurePersonalWorkspace after user creation", async () => {
      const { ensurePersonalWorkspace } = await import(
        "@/lib/workspace/ensure-personal-workspace"
      );
      await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(ensurePersonalWorkspace).toHaveBeenCalledWith("stable-id", null);
    });

    it("still returns 200 even when post-signup tasks throw", async () => {
      const { ensureUserAlbums } = await import(
        "@/lib/albums/ensure-user-albums"
      );
      vi.mocked(ensureUserAlbums).mockRejectedValueOnce(
        new Error("albums error"),
      );

      const res = await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      // Post-signup failures are non-fatal; user is still created
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // Internal / unexpected errors
  // -------------------------------------------------------------------------
  describe("error handling", () => {
    it("returns 500 when prisma.user.create throws unexpectedly", async () => {
      setupOpenRegistration();
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(new Error("DB connection lost"));

      const res = await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toMatch(/failed to create account/i);
    });

    it("returns 500 when prisma.user.findUnique throws unexpectedly", async () => {
      setupOpenRegistration();
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB timeout"));

      const res = await POST(
        makeRequest({ email: "user@example.com", password: "12345678" }),
      );
      expect(res.status).toBe(500);
    });
  });
});
