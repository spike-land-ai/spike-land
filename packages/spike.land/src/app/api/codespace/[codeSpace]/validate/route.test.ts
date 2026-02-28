import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTranspileCode = vi.fn();

vi.mock("@/lib/codespace/transpiler", () => ({
  transpileCode: (...args: unknown[]) => mockTranspileCode(...args),
  parseTranspileErrors: (msg: string) => [{ message: msg }],
}));

const { POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost/api/codespace/my-app/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "invalid json{",
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/codespace/[codeSpace]/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return valid=true for valid code", async () => {
    mockTranspileCode.mockResolvedValue("transpiled output");

    const req = makeRequest({ code: "const x = 1;" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.valid).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("should return valid=false for invalid code", async () => {
    mockTranspileCode.mockRejectedValue(new Error("Syntax error at line 1"));

    const req = makeRequest({ code: "const x = (" });
    const res = await POST(req as never);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.valid).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it("should return 400 for missing code field", async () => {
    const req = makeRequest({ notCode: "something" });
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("should return 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/codespace/my-app/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{{",
    });
    const res = await POST(req as never);

    expect(res.status).toBe(400);
  });
});
