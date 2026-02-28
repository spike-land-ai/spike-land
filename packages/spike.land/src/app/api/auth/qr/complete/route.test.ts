import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockCompleteQRAuth = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/qr-auth-service", () => ({
  completeQRAuth: mockCompleteQRAuth,
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

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/qr/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/qr/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 9,
      resetAt: Date.now() + 60000,
    });
    mockCompleteQRAuth.mockResolvedValue("user-123");
  });

  it("returns userId on valid completion", async () => {
    const request = makeRequest({ hash: "validhash", oneTimeCode: "valid-code" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json() as { userId: string; };
    expect(body.userId).toBe("user-123");
  });

  it("calls completeQRAuth with hash and oneTimeCode", async () => {
    const request = makeRequest({ hash: "myhash", oneTimeCode: "mycode" });
    await POST(request);

    expect(mockCompleteQRAuth).toHaveBeenCalledWith("myhash", "mycode");
  });

  it("returns 400 when hash is missing", async () => {
    const request = makeRequest({ oneTimeCode: "valid-code" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Missing hash or oneTimeCode");
    expect(mockCompleteQRAuth).not.toHaveBeenCalled();
  });

  it("returns 400 when oneTimeCode is missing", async () => {
    const request = makeRequest({ hash: "validhash" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Missing hash or oneTimeCode");
    expect(mockCompleteQRAuth).not.toHaveBeenCalled();
  });

  it("returns 400 when both hash and oneTimeCode are missing", async () => {
    const request = makeRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Missing hash or oneTimeCode");
  });

  it("returns 400 when session is invalid (wrong one-time code)", async () => {
    mockCompleteQRAuth.mockResolvedValue(null);

    const request = makeRequest({ hash: "validhash", oneTimeCode: "wrong-code" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Invalid or expired session");
  });

  it("returns 400 when session is expired", async () => {
    mockCompleteQRAuth.mockResolvedValue(null);

    const request = makeRequest({ hash: "expiredhash", oneTimeCode: "any-code" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Invalid or expired session");
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const request = makeRequest({ hash: "validhash", oneTimeCode: "valid-code" });
    const response = await POST(request);

    expect(response.status).toBe(429);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Too many requests");
    expect(mockCompleteQRAuth).not.toHaveBeenCalled();
  });

  it("uses x-forwarded-for IP for rate limit key", async () => {
    const request = makeRequest({ hash: "validhash", oneTimeCode: "valid-code" });
    await POST(request);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_complete:127.0.0.1",
      expect.anything(),
    );
  });

  it("uses 'unknown' as IP when x-forwarded-for header is absent", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(
      new Map() as unknown as Awaited<ReturnType<typeof headers>>,
    );

    const request = makeRequest({ hash: "validhash", oneTimeCode: "valid-code" });
    await POST(request);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_complete:unknown",
      expect.anything(),
    );
  });

  it("uses first IP from comma-separated x-forwarded-for", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce(
      new Map([["x-forwarded-for", "10.0.0.5, 172.16.0.1"]]) as unknown as Awaited<
        ReturnType<typeof headers>
      >,
    );

    const request = makeRequest({ hash: "validhash", oneTimeCode: "valid-code" });
    await POST(request);

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "qr_complete:10.0.0.5",
      expect.anything(),
    );
  });
});
