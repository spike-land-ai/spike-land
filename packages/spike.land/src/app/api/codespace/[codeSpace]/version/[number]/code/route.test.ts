import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetVersion = vi.fn();

vi.mock("@/lib/codespace/session-service", () => ({
  getVersion: (...args: unknown[]) => mockGetVersion(...args),
}));

const { GET, OPTIONS } = await import("./route");

function makeContext(codeSpace: string, number: string) {
  return { params: Promise.resolve({ codeSpace, number }) };
}

describe("GET /api/codespace/[codeSpace]/version/[number]/code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return raw source code", async () => {
    mockGetVersion.mockResolvedValue({
      number: 1,
      code: "export default () => <div>Hello</div>",
      transpiled: "var x;",
      html: "<div>Hello</div>",
      css: "",
      hash: "abc",
      createdAt: 1700000000000,
    });

    const req = new Request(
      "http://localhost/api/codespace/my-app/version/1/code",
    );
    const res = await GET(req as never, makeContext("my-app", "1"));

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("export default () => <div>Hello</div>");
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("should return 404 when version not found", async () => {
    mockGetVersion.mockResolvedValue(null);

    const req = new Request(
      "http://localhost/api/codespace/my-app/version/99/code",
    );
    const res = await GET(req as never, makeContext("my-app", "99"));

    expect(res.status).toBe(404);
  });

  it("should return 400 for invalid version number", async () => {
    const req = new Request(
      "http://localhost/api/codespace/my-app/version/abc/code",
    );
    const res = await GET(req as never, makeContext("my-app", "abc"));

    expect(res.status).toBe(400);
  });

  it("should return 400 for version number < 1", async () => {
    const req = new Request(
      "http://localhost/api/codespace/my-app/version/-1/code",
    );
    const res = await GET(req as never, makeContext("my-app", "-1"));

    expect(res.status).toBe(400);
  });

  it("should return 500 on service error", async () => {
    mockGetVersion.mockRejectedValue(new Error("DB error"));

    const req = new Request(
      "http://localhost/api/codespace/my-app/version/1/code",
    );
    const res = await GET(req as never, makeContext("my-app", "1"));

    expect(res.status).toBe(500);
  });

  it("should set immutable cache headers", async () => {
    mockGetVersion.mockResolvedValue({
      number: 1,
      hash: "x",
      createdAt: 1700000000000,
      code: "code",
      transpiled: "",
      html: "",
      css: "",
    });

    const req = new Request(
      "http://localhost/api/codespace/my-app/version/1/code",
    );
    const res = await GET(req as never, makeContext("my-app", "1"));

    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });

  it("should return 400 on invalid params", async () => {
    const req = new Request("http://localhost/test");
    const res = await GET(req as never, {
      params: Promise.reject(new Error("bad")),
    });

    expect(res.status).toBe(400);
  });
});

describe("OPTIONS /api/codespace/[codeSpace]/version/[number]/code", () => {
  it("should return 204 with CORS headers", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
