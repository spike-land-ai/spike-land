import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

// Top-level mock for Prisma
const mockQueryRaw = vi.fn();
vi.mock("@/lib/prisma", () => ({
  default: {
    // $queryRaw is called as a tagged template literal: prisma.$queryRaw`SELECT 1`
    // Tagged template literals pass a TemplateStringsArray as the first argument,
    // so the mock must be a function (not a plain object).
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

function createRequest(url = "http://localhost/api/health") {
  return new NextRequest(url);
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mockQueryRaw.mockReset();
  });

  test("returns 200 ok (shallow check)", async () => {
    const { GET } = await import("./route");
    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("returns 200 with db check on deep=true", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const { GET } = await import("./route");
    const response = await GET(
      createRequest("http://localhost/api/health?deep=true"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("connected");
  });

  test("returns 503 when db is unreachable on deep check", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));

    const { GET } = await import("./route");
    const response = await GET(
      createRequest("http://localhost/api/health?deep=true"),
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("unreachable");
  });
});
