import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPollQRAuth = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/qr-auth-service", () => ({
  pollQRAuth: mockPollQRAuth,
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitConfigs: {
    qrPoll: { maxRequests: 60, windowMs: 60000 },
  },
}));

import { GET } from "./route";

function makeRequest(hash?: string): NextRequest {
  const url = hash
    ? `http://localhost:3000/api/auth/qr/poll?hash=${hash}`
    : "http://localhost:3000/api/auth/qr/poll";
  return new NextRequest(url);
}

describe("GET /api/auth/qr/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
  });

  it("returns status on valid hash when session is PENDING", async () => {
    mockPollQRAuth.mockResolvedValue({ status: "PENDING" });

    const request = makeRequest("validhash123");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; };
    expect(body.status).toBe("PENDING");
  });

  it("returns status and oneTimeCode when session is APPROVED", async () => {
    mockPollQRAuth.mockResolvedValue({
      status: "APPROVED",
      oneTimeCode: "secret-code",
      userId: "user-123",
    });

    const request = makeRequest("validhash456");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json() as {
      status: string;
      oneTimeCode?: string;
      userId?: string;
    };
    expect(body.status).toBe("APPROVED");
    // oneTimeCode IS returned so desktop can complete auth
    expect(body.oneTimeCode).toBe("secret-code");
    // userId must NOT be exposed in poll response
    expect(body.userId).toBeUndefined();
  });

  it("does not return oneTimeCode when session is PENDING", async () => {
    mockPollQRAuth.mockResolvedValue({ status: "PENDING" });

    const request = makeRequest("validhash123");
    const response = await GET(request);

    const body = await response.json() as { status: string; oneTimeCode?: string; };
    expect(body.status).toBe("PENDING");
    expect(body.oneTimeCode).toBeUndefined();
  });

  it("returns 400 when hash parameter is missing", async () => {
    const request = makeRequest();
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Missing hash parameter");
    expect(mockPollQRAuth).not.toHaveBeenCalled();
  });

  it("returns 404 when session is not found or expired", async () => {
    mockPollQRAuth.mockResolvedValue(null);

    const request = makeRequest("expiredhash");
    const response = await GET(request);

    expect(response.status).toBe(404);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Session expired or not found");
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const request = makeRequest("somehash");
    const response = await GET(request);

    expect(response.status).toBe(429);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Too many requests");
    expect(mockPollQRAuth).not.toHaveBeenCalled();
  });

  it("uses hash as rate limit key", async () => {
    mockPollQRAuth.mockResolvedValue({ status: "PENDING" });

    const request = makeRequest("myhash");
    await GET(request);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_poll:myhash",
      expect.anything(),
    );
  });

  it("calls pollQRAuth with the provided hash", async () => {
    mockPollQRAuth.mockResolvedValue({ status: "PENDING" });

    const request = makeRequest("specific-hash-value");
    await GET(request);

    expect(mockPollQRAuth).toHaveBeenCalledWith("specific-hash-value");
  });
});
