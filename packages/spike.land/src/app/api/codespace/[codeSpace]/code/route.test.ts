import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockUpdateSession = vi.fn();

vi.mock("@/lib/codespace/session-service", () => ({
  SessionService: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
    updateSession: (...args: unknown[]) => mockUpdateSession(...args),
  },
}));

const { GET, PUT } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(codeSpace: string) {
  return { params: Promise.resolve({ codeSpace }) };
}

function makeRequest(
  url: string,
  method: string,
  body?: Record<string, unknown>,
) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/codespace/[codeSpace]/code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return code for existing codespace", async () => {
    mockGetSession.mockResolvedValue({
      code: "const x = 1;",
      codeSpace: "my-app",
    });

    const req = makeRequest(
      "http://localhost/api/codespace/my-app/code",
      "GET",
    );
    const res = await GET(req as never, makeContext("my-app"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe("const x = 1;");
  });

  it("should return 404 for nonexistent codespace", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = makeRequest(
      "http://localhost/api/codespace/nonexistent/code",
      "GET",
    );
    const res = await GET(req as never, makeContext("nonexistent"));

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/codespace/[codeSpace]/code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update code successfully", async () => {
    mockGetSession.mockResolvedValue({
      code: "old code",
      codeSpace: "my-app",
      transpiled: "",
      html: "",
      css: "",
      messages: [],
    });
    mockUpdateSession.mockResolvedValue({
      success: true,
      session: {
        code: "new code",
        codeSpace: "my-app",
        hash: "new-hash",
      },
    });

    const req = makeRequest(
      "http://localhost/api/codespace/my-app/code",
      "PUT",
      { code: "new code", hash: "expected-hash" },
    );
    const res = await PUT(req as never, makeContext("my-app"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should return 400 when code or hash missing", async () => {
    const req = makeRequest(
      "http://localhost/api/codespace/my-app/code",
      "PUT",
      { code: "new code" }, // missing hash
    );
    const res = await PUT(req as never, makeContext("my-app"));

    expect(res.status).toBe(400);
  });

  it("should return 404 when codespace not found", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = makeRequest(
      "http://localhost/api/codespace/nonexistent/code",
      "PUT",
      { code: "new code", hash: "abc" },
    );
    const res = await PUT(req as never, makeContext("nonexistent"));

    expect(res.status).toBe(404);
  });

  it("should return 409 on hash mismatch", async () => {
    mockGetSession.mockResolvedValue({
      code: "old code",
      codeSpace: "my-app",
      messages: [],
    });
    mockUpdateSession.mockResolvedValue({
      success: false,
      error: "Conflict: Hash mismatch",
      session: { hash: "actual-hash" },
    });

    const req = makeRequest(
      "http://localhost/api/codespace/my-app/code",
      "PUT",
      { code: "new code", hash: "wrong-hash" },
    );
    const res = await PUT(req as never, makeContext("my-app"));

    expect(res.status).toBe(409);
  });
});
