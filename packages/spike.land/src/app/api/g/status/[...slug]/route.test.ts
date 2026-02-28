import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";
import * as routeCache from "@/lib/generate/route-cache";
import * as nextServer from "next/server";

vi.mock("@/lib/generate/route-cache");

const mockRequest = new Request("https://spike.land/api/g/status/foo");

describe("GET /api/g/status/[...slug]", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns 200 with route status", async () => {
    vi.mocked(routeCache.getRouteBySlug).mockResolvedValue({
      status: "COMPLETED",
      title: "My Route",
      description: "A description",
      codespaceUrl: "https://example.com/codespace",
      generationTimeMs: 1000,
      viewCount: 42,
    } as any);

    const response = await GET(mockRequest, {
      params: Promise.resolve({ slug: ["foo"] }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "COMPLETED",
      title: "My Route",
      description: "A description",
      codespaceUrl: "https://example.com/codespace",
      generationTimeMs: 1000,
      viewCount: 42,
    });
  });

  test("returns 200 NOT_FOUND if route does not exist", async () => {
    vi.mocked(routeCache.getRouteBySlug).mockResolvedValue(null);

    const response = await GET(mockRequest, {
      params: Promise.resolve({ slug: ["bar"] }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "NOT_FOUND" });
  });

  test("returns 500 when data layer (getRouteBySlug) throws an error", async () => {
    vi.mocked(routeCache.getRouteBySlug).mockRejectedValue(
      new Error("Prisma DB Error"),
    );

    const response = await GET(mockRequest, {
      params: Promise.resolve({ slug: ["baz"] }),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch route status",
    });
  });

  test("returns 500 on unhandled outer error without stack trace", async () => {
    const nextResponseSpy = vi.spyOn(nextServer.NextResponse, "json")
      .mockImplementationOnce(() => {
        throw new Error("Unexpected outer error");
      });

    const response = await GET(mockRequest, {
      params: Promise.resolve({ slug: ["qux"] }),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    nextResponseSpy.mockRestore();
  });
});
