import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockRateLimit = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
}));

const mockAuth = vi.hoisted(() => ({
  auth: vi.fn(),
}));

const mockApiKeyManager = vi.hoisted(() => ({
  getApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
}));

vi.mock("@/lib/rate-limiter", () => mockRateLimit);
vi.mock("@/lib/auth", () => mockAuth);
vi.mock("@/lib/mcp/api-key-manager", () => mockApiKeyManager);

import { DELETE, GET } from "./route";

function makeRequest(method: string, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/settings/api-keys/key-1", {
    method,
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

const PARAMS = { params: Promise.resolve({ id: "key-1" }) };

describe("GET /api/settings/api-keys/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.auth.mockResolvedValue({ user: { id: "user-123" } });
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.checkRateLimit.mockResolvedValue({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await GET(makeRequest("GET"), PARAMS);
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error).toMatch(/too many requests/i);
  });

  it("proceeds normally when not rate limited", async () => {
    mockRateLimit.checkRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });

    mockApiKeyManager.getApiKey.mockResolvedValue(
      {
        id: "key-1",
        name: "test",
        keyPrefix: "sk_...",
        isActive: true,
        createdAt: new Date(),
      },
    );

    const res = await GET(makeRequest("GET"), PARAMS);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/settings/api-keys/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.auth.mockResolvedValue({ user: { id: "user-123" } });
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.checkRateLimit.mockResolvedValue({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const res = await DELETE(makeRequest("DELETE"), PARAMS);
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error).toMatch(/too many requests/i);
  });

  it("proceeds normally when not rate limited", async () => {
    mockRateLimit.checkRateLimit.mockResolvedValue({
      isLimited: false,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });

    mockApiKeyManager.revokeApiKey.mockResolvedValue({ success: true });

    const res = await DELETE(makeRequest("DELETE"), PARAMS);
    expect(res.status).toBe(200);
  });
});
