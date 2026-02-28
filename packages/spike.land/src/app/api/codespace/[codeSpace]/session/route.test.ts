import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn();

vi.mock("@/lib/codespace/session-service", () => ({
  SessionService: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}));

vi.mock("@/lib/codespace/hash-utils", () => ({
  computeSessionHash: vi.fn().mockReturnValue("mock-hash-123"),
}));

const { GET } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(codeSpace: string) {
  return { params: Promise.resolve({ codeSpace }) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/codespace/[codeSpace]/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return session data for existing codespace", async () => {
    mockGetSession.mockResolvedValue({
      code: "const x = 1;",
      codeSpace: "my-app",
      transpiled: "var x = 1;",
      html: "<div></div>",
      css: "",
      messages: [],
    });

    const req = new Request(
      "http://localhost/api/codespace/my-app/session",
    );
    const res = await GET(req as never, makeContext("my-app"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.codeSpace).toBe("my-app");
    expect(body.hash).toBe("mock-hash-123");
    expect(body.session.code).toBe("const x = 1;");
    expect(body.session.transpiled).toBe("var x = 1;");
  });

  it("should return 404 for nonexistent codespace", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = new Request(
      "http://localhost/api/codespace/nonexistent/session",
    );
    const res = await GET(req as never, makeContext("nonexistent"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
