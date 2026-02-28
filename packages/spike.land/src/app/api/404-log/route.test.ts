import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockRedis = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
}));

const mockRateLimit = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  rateLimitConfigs: {
    notFoundLog: { maxRequests: 10, windowMs: 60_000 },
  },
}));

const mockAlert = vi.hoisted(() => ({
  triggerGitHubAlert: vi.fn(),
}));

const mockLogger = vi.hoisted(() => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/upstash/client", () => ({ redis: mockRedis }));
vi.mock("@/lib/rate-limiter", () => mockRateLimit);
vi.mock("@/lib/404-alert", () => mockAlert);
vi.mock("@/lib/logger", () => mockLogger);

import { POST } from "./route";

function makeRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/404-log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/404-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.checkRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });
  });

  it("returns 200 with { ok: true } for valid request", async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    const res = await POST(makeRequest({ url: "/admin/nonexistent" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
  });

  it("returns 400 for missing url", async () => {
    const res = await POST(makeRequest({ referrer: "https://example.com" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for url not starting with /", async () => {
    const res = await POST(makeRequest({ url: "admin/foo" }));

    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.checkRateLimit.mockResolvedValue({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await POST(makeRequest({ url: "/admin/foo" }));

    expect(res.status).toBe(429);
  });

  it("triggers alert when Redis count reaches 2", async () => {
    mockRedis.incr.mockResolvedValue(2);
    mockAlert.triggerGitHubAlert.mockResolvedValue({ created: true });

    await POST(makeRequest({ url: "/admin/missing" }));

    // Wait for fire-and-forget async to settle
    await new Promise(r => setTimeout(r, 50));

    expect(mockAlert.triggerGitHubAlert).toHaveBeenCalledWith(
      "/admin/missing",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("does not trigger alert when count is 1", async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    await POST(makeRequest({ url: "/admin/missing" }));

    await new Promise(r => setTimeout(r, 50));

    expect(mockAlert.triggerGitHubAlert).not.toHaveBeenCalled();
  });

  it("does not trigger alert when count is 3", async () => {
    mockRedis.incr.mockResolvedValue(3);

    await POST(makeRequest({ url: "/admin/missing" }));

    await new Promise(r => setTimeout(r, 50));

    expect(mockAlert.triggerGitHubAlert).not.toHaveBeenCalled();
  });

  it("skips bot scanner paths silently", async () => {
    const res = await POST(makeRequest({ url: "/wp-admin/setup.php" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(mockLogger.default.info).not.toHaveBeenCalled();
  });
});
