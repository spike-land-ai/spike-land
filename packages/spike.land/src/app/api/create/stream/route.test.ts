import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

vi.mock("@/lib/rate-limit-presets", () => ({
  checkGenerationRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/create/circuit-breaker", () => ({
  getCircuitState: vi.fn().mockResolvedValue("CLOSED"),
  recordCircuitFailure: vi.fn(),
  recordCircuitSuccess: vi.fn(),
}));

vi.mock("@/lib/create/codespace-service", () => ({
  generateCodespaceId: vi.fn().mockReturnValue("test-codespace"),
  updateCodespace: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/create/content-generator", () => ({
  generateAppContent: vi.fn().mockResolvedValue({
    content: {
      title: "Test App",
      description: "A test app",
      code: "export default () => <div>Test</div>",
      relatedApps: [],
    },
    rawCode: null,
    error: null,
  }),
  attemptCodeCorrection: vi.fn(),
}));

vi.mock("@/lib/create/content-service", () => ({
  getCreatedApp: vi.fn().mockResolvedValue(null),
  markAsGenerating: vi.fn(),
  updateAppContent: vi.fn(),
  updateAppStatus: vi.fn(),
}));

vi.mock("@/lib/create/agent-loop", () => ({
  agentGenerateApp: vi.fn(),
}));

vi.mock("@/lib/ai/claude-client", () => ({
  isClaudeConfigured: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { checkGenerationRateLimit } = await import("@/lib/rate-limit-presets");
const { getCreatedApp } = await import("@/lib/create/content-service");

const mockCheckRateLimit = vi.mocked(checkGenerationRateLimit);
const mockGetCreatedApp = vi.mocked(getCreatedApp);

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  mockGetCreatedApp.mockResolvedValue(null);
});

describe("POST /api/create/stream", () => {
  it("returns 429 on rate limit", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/create/stream", {
      method: "POST",
      body: JSON.stringify({ path: ["test-app"] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Rate limit");
  });

  it("returns early for already published apps", async () => {
    mockGetCreatedApp.mockResolvedValue({
      slug: "test-app",
      status: "PUBLISHED",
      codespaceUrl: "/api/codespace/test/embed",
    } as Awaited<ReturnType<typeof getCreatedApp>>);

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/create/stream", {
      method: "POST",
      body: JSON.stringify({ path: ["test-app"] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PUBLISHED");
    expect(body.success).toBe(true);
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/create/stream", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "text/plain" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty path", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/create/stream", {
      method: "POST",
      body: JSON.stringify({ path: [] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("geminiFallbackStream metadata", () => {
  it("emits correct Gemini agent name and model (not Opus)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const routeFile = path.resolve(
      process.cwd(),
      "src/app/api/create/stream/route.ts",
    );
    const routeSource = fs.readFileSync(routeFile, "utf-8");

    // Verify the source code contains the correct agent metadata
    expect(routeSource).toContain("name: \"Gemini Flash\"");
    expect(routeSource).toContain("model: \"gemini-3-flash-preview\"");
    expect(routeSource).toContain("agent: \"Gemini Flash\"");
    expect(routeSource).not.toContain("name: \"Opus 4.6\"");
    expect(routeSource).not.toContain("agent: \"Opus 4.6\"");
  });
});
