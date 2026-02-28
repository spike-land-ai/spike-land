import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetVersionsList = vi.fn();

vi.mock("@/lib/codespace/session-service", () => ({
  getVersionsList: (...args: unknown[]) => mockGetVersionsList(...args),
}));

const { GET, OPTIONS } = await import("./route");

function makeContext(codeSpace: string) {
  return { params: Promise.resolve({ codeSpace }) };
}

describe("GET /api/codespace/[codeSpace]/versions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return versions list", async () => {
    const versions = [
      { number: 2, hash: "abc", createdAt: 1700000000000 },
      { number: 1, hash: "def", createdAt: 1699000000000 },
    ];
    mockGetVersionsList.mockResolvedValue(versions);

    const req = new Request("http://localhost/api/codespace/my-app/versions");
    const res = await GET(req as never, makeContext("my-app"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.codeSpace).toBe("my-app");
    expect(body.versions).toEqual(versions);
    expect(mockGetVersionsList).toHaveBeenCalledWith("my-app");
  });

  it("should return empty versions array when none exist", async () => {
    mockGetVersionsList.mockResolvedValue([]);

    const req = new Request("http://localhost/api/codespace/empty-cs/versions");
    const res = await GET(req as never, makeContext("empty-cs"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.versions).toEqual([]);
  });

  it("should return 500 on service error", async () => {
    mockGetVersionsList.mockRejectedValue(new Error("DB failure"));

    const req = new Request("http://localhost/api/codespace/my-app/versions");
    const res = await GET(req as never, makeContext("my-app"));

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe("Failed to retrieve versions");
  });

  it("should return 400 on invalid params", async () => {
    const req = new Request("http://localhost/api/codespace/bad/versions");
    const res = await GET(req as never, {
      params: Promise.reject(new Error("bad")),
    });

    expect(res.status).toBe(400);
  });

  it("should set CORS headers", async () => {
    mockGetVersionsList.mockResolvedValue([]);

    const req = new Request("http://localhost/api/codespace/my-app/versions");
    const res = await GET(req as never, makeContext("my-app"));

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("OPTIONS /api/codespace/[codeSpace]/versions", () => {
  it("should return 204 with CORS headers", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
