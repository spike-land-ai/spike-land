import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";
import * as workspace from "@/lib/workspace";
import * as nextServer from "next/server";

vi.mock("@/lib/workspace");

describe("GET /api/workspace/personal", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns 200 with workspace id", async () => {
    vi.mocked(workspace.getPersonalWorkspaceId).mockResolvedValue("ws_123");

    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ workspaceId: "ws_123" });
  });

  test("returns 500 when data layer (getPersonalWorkspaceId) throws an error", async () => {
    vi.mocked(workspace.getPersonalWorkspaceId).mockRejectedValue(
      new Error("Prisma DB Error"),
    );

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch workspace",
    });
  });

  test("returns 500 on unhandled outer error without stack trace", async () => {
    const nextResponseSpy = vi.spyOn(nextServer.NextResponse, "json")
      .mockImplementationOnce(() => {
        throw new Error("Unexpected outer error");
      });

    const response = await GET();
    expect(response.status).toBe(500);

    // nextResponse.json is also called inside the catch handler, so it succeeds the second time
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    nextResponseSpy.mockRestore();
  });
});
