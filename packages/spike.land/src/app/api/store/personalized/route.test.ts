import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";
import { auth } from "@/lib/auth";
import { getPersonalizedApps } from "@/lib/avl-profile/personalization";
import * as nextServer from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/avl-profile/personalization", () => ({
  getPersonalizedApps: vi.fn(),
}));

describe("GET /api/store/personalized", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user_123" } } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns 200 with personalized apps for authenticated user", async () => {
    vi.mocked(getPersonalizedApps).mockResolvedValue([
      { id: "app_1", name: "App 1" } as any,
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.apps).toHaveLength(1);
    expect(json.apps[0].id).toBe("app_1");
  });

  test("returns 200 with all apps for unauthenticated user", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.apps.length).toBeGreaterThan(0);
  });

  test("returns 500 when auth throws an error", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("Auth Service Down"));

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch personalized apps",
    });
  });

  test("returns 500 when data layer (getPersonalizedApps) throws an error", async () => {
    vi.mocked(getPersonalizedApps).mockRejectedValue(
      new Error("Prisma DB Error"),
    );

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch personalized apps",
    });
  });

  test("returns 500 on unhandled outer error without stack trace", async () => {
    const nextResponseSpy = vi.spyOn(nextServer.NextResponse, "json")
      .mockImplementationOnce(() => {
        throw new Error("Unexpected outer error");
      });

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    nextResponseSpy.mockRestore();
  });
});
