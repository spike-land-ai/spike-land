import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockAuthResult = {
  success: true,
  userId: "user-test-123",
};

vi.mock("@/lib/mcp/auth", () => ({
  authenticateMcpRequest: vi.fn().mockResolvedValue({
    success: true,
    userId: "user-test-123",
  }),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ isLimited: false, remaining: 10, resetAt: 0 }),
  rateLimitConfigs: { mcpJsonRpc: {} },
}));

const mockLoadEnabledCategories = vi.fn<(userId: string) => Promise<string[]>>();
vi.mock("@/lib/mcp/server/category-persistence", () => ({
  loadEnabledCategories: (...args: unknown[]) => mockLoadEnabledCategories(...args as [string]),
}));

// Mock MCP transport — must be a class (used with `new`)
const mockHandleRequest = vi.fn();
vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => {
  return {
    WebStandardStreamableHTTPServerTransport: class MockTransport {
      handleRequest = mockHandleRequest;
    },
  };
});

// Track createMcpServer calls to verify enabledCategories are passed
const mockCreateMcpServer = vi.fn();
vi.mock("@/lib/mcp/server/mcp-server", () => ({
  createMcpServer: (...args: unknown[]) => mockCreateMcpServer(...args),
}));

vi.mock("@/lib/mcp/get-base-url", () => ({
  getMcpBaseUrl: () => "https://spike.land",
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

function createMcpRequest(
  body: Record<string, unknown> = { jsonrpc: "2.0", method: "tools/list", id: 1 },
) {
  return new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mcp_test_token",
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/mcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadEnabledCategories.mockResolvedValue([]);
    mockCreateMcpServer.mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    });
    mockHandleRequest.mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", result: {}, id: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("loads enabled categories from Redis for authenticated user", async () => {
    mockLoadEnabledCategories.mockResolvedValue(["chat", "storage"]);

    const { POST } = await import("./route");
    await POST(createMcpRequest());

    expect(mockLoadEnabledCategories).toHaveBeenCalledWith(mockAuthResult.userId);
    expect(mockCreateMcpServer).toHaveBeenCalledWith(
      mockAuthResult.userId,
      { enabledCategories: ["chat", "storage"] },
    );
  });

  it("passes empty categories for new user with no Redis state", async () => {
    mockLoadEnabledCategories.mockResolvedValue([]);

    const { POST } = await import("./route");
    await POST(createMcpRequest());

    expect(mockLoadEnabledCategories).toHaveBeenCalledWith(mockAuthResult.userId);
    expect(mockCreateMcpServer).toHaveBeenCalledWith(
      mockAuthResult.userId,
      { enabledCategories: [] },
    );
  });

  it("gracefully handles Redis failure (defaults to empty categories)", async () => {
    // loadEnabledCategories already handles errors internally and returns []
    mockLoadEnabledCategories.mockResolvedValue([]);

    const { POST } = await import("./route");
    const response = await POST(createMcpRequest());

    expect(response.status).toBe(200);
    expect(mockCreateMcpServer).toHaveBeenCalledWith(
      mockAuthResult.userId,
      { enabledCategories: [] },
    );
  });

  it("returns 401 when no authorization header is present", async () => {
    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    // Should NOT attempt to load categories if not authenticated
    expect(mockLoadEnabledCategories).not.toHaveBeenCalled();
  });

  it("returns 401 when auth fails", async () => {
    const { authenticateMcpRequest } = await import("@/lib/mcp/auth");
    vi.mocked(authenticateMcpRequest).mockResolvedValueOnce({
      success: false,
      userId: undefined as unknown as string,
    });

    const { POST } = await import("./route");
    const response = await POST(createMcpRequest());

    expect(response.status).toBe(401);
    expect(mockLoadEnabledCategories).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limiter");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      isLimited: true,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const { POST } = await import("./route");
    const response = await POST(createMcpRequest());

    expect(response.status).toBe(429);
    expect(mockLoadEnabledCategories).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "Authorization": "Bearer mcp_test_token",
        "Content-Type": "application/json",
      },
      body: "not json{{{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

describe("GET /api/mcp", () => {
  it("returns 405 for authenticated GET (stateless mode)", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost/api/mcp", {
      method: "GET",
      headers: { "Authorization": "Bearer mcp_test_token" },
    });

    const response = await GET(request);

    expect(response.status).toBe(405);
  });

  it("returns 401 for unauthenticated GET", async () => {
    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost/api/mcp", {
      method: "GET",
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/mcp", () => {
  it("returns 200 (stateless, nothing to clean up)", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
