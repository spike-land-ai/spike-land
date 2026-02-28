import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();
const mockUpdateSession = vi.fn();
const mockBroadcastToCodespace = vi.fn();

vi.mock("@/lib/codespace/session-service", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock("@/lib/codespace/broadcast", () => ({
  broadcastToCodespace: (...args: unknown[]) => mockBroadcastToCodespace(...args),
}));

vi.mock("@/lib/codespace/cors", () => ({
  CORS_HEADERS: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  corsOptions: () => new Response(null, { status: 204 }),
}));

vi.mock("@/lib/try-catch", () => ({
  tryCatch: async <T>(promise: Promise<T>) => {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
}));

const { POST, OPTIONS } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(codeSpace: string) {
  return { params: Promise.resolve({ codeSpace }) };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/codespace/my-app/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/codespace/[codeSpace]/update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBroadcastToCodespace.mockResolvedValue(undefined);
  });

  it("should update session and broadcast", async () => {
    mockGetSession.mockResolvedValue({
      code: "old code",
      codeSpace: "my-app",
      transpiled: "",
      html: "",
      css: "",
      messages: [],
      requiresReRender: false,
    });
    mockUpdateSession.mockResolvedValue({
      success: true,
      session: {
        code: "new code",
        transpiled: "transpiled",
        html: "<div></div>",
        css: "",
        hash: "new-hash",
      },
    });

    const req = makeRequest({
      code: "new code",
      transpiled: "transpiled",
      html: "<div></div>",
      expectedHash: "old-hash",
    });
    const res = await POST(req as never, makeContext("my-app"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hash).toBe("new-hash");
    expect(mockBroadcastToCodespace).toHaveBeenCalledWith(
      "my-app",
      expect.objectContaining({ type: "session_update" }),
    );
  });

  it("should return 409 on hash mismatch", async () => {
    mockGetSession.mockResolvedValue({
      code: "current code",
      codeSpace: "my-app",
      messages: [],
    });
    mockUpdateSession.mockResolvedValue({
      success: false,
      error: "Conflict: Hash mismatch",
      session: { hash: "actual-hash" },
    });

    const req = makeRequest({
      code: "new code",
      expectedHash: "wrong-hash",
    });
    const res = await POST(req as never, makeContext("my-app"));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("Conflict");
  });

  it("should return 400 when required fields missing", async () => {
    const req = makeRequest({ code: "new code" }); // missing expectedHash
    const res = await POST(req as never, makeContext("my-app"));

    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/codespace/my-app/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    const res = await POST(req as never, makeContext("my-app"));

    expect(res.status).toBe(400);
  });
});

describe("OPTIONS /api/codespace/[codeSpace]/update", () => {
  it("should return 204 for CORS preflight", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
