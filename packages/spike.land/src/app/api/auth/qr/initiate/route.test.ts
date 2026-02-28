import { beforeEach, describe, expect, it, vi } from "vitest";

const mockInitiateQRAuth = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/qr-auth-service", () => ({
  initiateQRAuth: mockInitiateQRAuth,
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitConfigs: {
    qrAuth: { maxRequests: 10, windowMs: 60000 },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map([["x-forwarded-for", "127.0.0.1"]])),
}));

import { POST } from "./route";

describe("POST /api/auth/qr/initiate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 9,
      resetAt: Date.now() + 60000,
    });
    mockInitiateQRAuth.mockResolvedValue({
      token: "test-token-abc123",
      hash: "a".repeat(64),
    });
  });

  it("returns token and hash on successful POST", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    const body = await response.json() as { token: string; hash: string; };
    expect(body.token).toBe("test-token-abc123");
    expect(body.hash).toBe("a".repeat(64));
  });

  it("calls initiateQRAuth to generate session", async () => {
    await POST();

    expect(mockInitiateQRAuth).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const response = await POST();

    expect(response.status).toBe(429);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Too many requests");
    expect(mockInitiateQRAuth).not.toHaveBeenCalled();
  });

  it("uses x-forwarded-for IP for rate limit key", async () => {
    await POST();

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_initiate:127.0.0.1",
      expect.anything(),
    );
  });

  it("uses 'unknown' as IP when x-forwarded-for header is absent", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(
      new Map() as unknown as Awaited<ReturnType<typeof headers>>,
    );

    await POST();

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_initiate:unknown",
      expect.anything(),
    );
  });

  it("uses first IP from comma-separated x-forwarded-for", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(
      new Map([["x-forwarded-for", "10.0.0.1, 192.168.0.1"]]) as unknown as Awaited<
        ReturnType<typeof headers>
      >,
    );

    await POST();

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_initiate:10.0.0.1",
      expect.anything(),
    );
  });
});
