import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mockQueryRaw = vi.fn();
vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

const mockPing = vi.fn();
vi.mock("@/lib/upstash/client", () => ({
  redis: {
    ping: (...args: unknown[]) => mockPing(...args),
  },
}));

describe("GET /api/ready", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mockQueryRaw.mockReset();
    mockPing.mockReset();
    // Ensure Redis is seen as configured so the route actually calls ping()
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
  });

  test("returns 200 ready when both DB and Redis are healthy", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockPing.mockResolvedValue("PONG");

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ready");
    expect(body.checks.database).toBe("connected");
    expect(body.checks.redis).toBe("connected");
  });

  test("returns 503 when DB is unreachable", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));
    mockPing.mockResolvedValue("PONG");

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("not_ready");
    expect(body.checks.database).toBe("unreachable");
    expect(body.checks.redis).toBe("connected");
  });

  test("returns 503 when Redis is unreachable", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockPing.mockRejectedValue(new Error("ECONNREFUSED"));

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("not_ready");
    expect(body.checks.database).toBe("connected");
    expect(body.checks.redis).toBe("unreachable");
  });

  test("returns 503 when both DB and Redis are unreachable", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));
    mockPing.mockRejectedValue(new Error("ECONNREFUSED"));

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("not_ready");
    expect(body.checks.database).toBe("unreachable");
    expect(body.checks.redis).toBe("unreachable");
  });
});
