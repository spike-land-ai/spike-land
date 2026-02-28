import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockRateLimit = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
}));

const mockAuth = vi.hoisted(() => ({
  auth: vi.fn(),
}));

const mockApiKeyManager = vi.hoisted(() => ({
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  countActiveApiKeys: vi.fn(),
  MAX_API_KEYS_PER_USER: 10,
}));

vi.mock("@/lib/rate-limiter", () => mockRateLimit);
vi.mock("@/lib/auth", () => mockAuth);
vi.mock("@/lib/mcp/api-key-manager", () => mockApiKeyManager);

import { GET, POST } from "./route";

function makeGetRequest(ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/settings/api-keys", {
    method: "GET",
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

function makePostRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/settings/api-keys", {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("GET /api/settings/api-keys", () => {
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

    const res = await GET(makeGetRequest());
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

    mockApiKeyManager.listApiKeys.mockResolvedValue([
      {
        id: "key-1",
        name: "test",
        keyPrefix: "sk_...",
        isActive: true,
        createdAt: new Date(),
      },
    ]);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
  });
});

describe("POST /api/settings/api-keys", () => {
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

    const res = await POST(makePostRequest({ name: "test-key" }));
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

    mockApiKeyManager.countActiveApiKeys.mockResolvedValue(0);
    mockApiKeyManager.createApiKey.mockResolvedValue({
      id: "key-1",
      name: "test-key",
      key: "sk_full",
      keyPrefix: "sk_...",
      createdAt: new Date(),
    });

    const res = await POST(makePostRequest({ name: "test-key" }));
    expect(res.status).toBe(200);
  });
});
