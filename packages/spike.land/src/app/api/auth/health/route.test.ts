import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockQueryRaw, mockPing } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
  mockPing: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock("@/lib/upstash/client", () => ({
  redis: { ping: mockPing },
}));

async function importGET() {
  const mod = await import("./route");
  return mod.GET;
}

function createRequest(url = "http://localhost/api/auth/health") {
  return new NextRequest(url);
}

describe("GET /api/auth/health", () => {
  beforeEach(() => {
    vi.resetModules();
    mockQueryRaw.mockReset();
    mockPing.mockReset();

    vi.stubEnv("GITHUB_ID", "gh-id");
    vi.stubEnv("GITHUB_SECRET", "gh-secret");
    vi.stubEnv("GOOGLE_ID", "g-id");
    vi.stubEnv("GOOGLE_SECRET", "g-secret");
    vi.stubEnv("AUTH_APPLE_ID", "apple-id");
    vi.stubEnv("AUTH_APPLE_TEAM_ID", "apple-team");
    vi.stubEnv("AUTH_FACEBOOK_ID", "fb-id");
    vi.stubEnv("AUTH_FACEBOOK_SECRET", "fb-secret");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-token");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("REGISTRATION_OPEN", "true");
    vi.stubEnv("EMAIL_FROM", "noreply@spike.land");
  });

  test("returns 200 ok when database and redis are healthy", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const response = await GET(createRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("connected");
    expect(body.checks.redis).toBe("connected");
  });

  test("reports all providers as configured when env vars are set", async () => {
    mockQueryRaw.mockResolvedValue([]);
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const body = await (await GET(createRequest())).json();

    expect(body.providers.github).toBe(true);
    expect(body.providers.google).toBe(true);
    expect(body.providers.apple).toBe(true);
    expect(body.providers.facebook).toBe(true);
  });

  test("reports providers as unconfigured when env vars are missing", async () => {
    vi.stubEnv("GITHUB_ID", "");
    vi.stubEnv("GOOGLE_ID", "");
    vi.stubEnv("AUTH_APPLE_ID", "");
    vi.stubEnv("AUTH_FACEBOOK_ID", "");
    mockQueryRaw.mockResolvedValue([]);
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const body = await (await GET(createRequest())).json();

    expect(body.providers.github).toBe(false);
    expect(body.providers.google).toBe(false);
    expect(body.providers.apple).toBe(false);
    expect(body.providers.facebook).toBe(false);
  });

  test("returns 503 degraded when database is unreachable", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const response = await GET(createRequest());
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("unreachable");
  });

  test("returns timeout status when database is slow", async () => {
    mockQueryRaw.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10_000)),
    );
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const response = await GET(createRequest());
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.checks.database).toBe("timeout");
  }, 10_000);

  test("reports redis as not_configured when env vars are absent", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    mockQueryRaw.mockResolvedValue([]);

    const GET = await importGET();
    const body = await (await GET(createRequest())).json();

    expect(body.checks.redis).toBe("not_configured");
  });

  test("reports redis as unreachable when ping fails", async () => {
    mockQueryRaw.mockResolvedValue([]);
    mockPing.mockRejectedValue(new Error("ECONNREFUSED"));

    const GET = await importGET();
    const body = await (await GET(createRequest())).json();

    expect(body.checks.redis).toBe("unreachable");
  });

  test("reports registrationOpen and emailConfigured from env", async () => {
    mockQueryRaw.mockResolvedValue([]);
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const body = await (await GET(createRequest())).json();

    expect(body.config.registrationOpen).toBe(true);
    expect(body.config.emailConfigured).toBe(true);
  });

  test("reports registrationOpen=false when env var is not 'true'", async () => {
    vi.stubEnv("REGISTRATION_OPEN", "false");
    vi.stubEnv("EMAIL_FROM", "");
    mockQueryRaw.mockResolvedValue([]);
    mockPing.mockResolvedValue("PONG");

    const GET = await importGET();
    const body = await (await GET(createRequest())).json();

    expect(body.config.registrationOpen).toBe(false);
    expect(body.config.emailConfigured).toBe(false);
  });
});
