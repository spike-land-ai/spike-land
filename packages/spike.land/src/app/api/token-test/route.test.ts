import { describe, expect, test, vi } from "vitest";
import { POST } from "./route";

// Mock dependencies
vi.mock("@/lib/ai/claude-client", () => ({
  isClaudeConfigured: vi.fn().mockResolvedValue(true),
  getClaudeClient: vi.fn().mockResolvedValue({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "ok" }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    },
  }),
}));

vi.mock("@/lib/ai/token-pool", () => ({
  getPoolInfo: vi.fn().mockResolvedValue({
    poolSize: 1,
    activeIndex: 0,
    maskedTokens: ["***"],
  }),
}));

// Mock auth
const mockAuth = vi.fn();
const mockVerifyAdminAccess = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
  verifyAdminAccess: (session: unknown) => mockVerifyAdminAccess(session),
}));

describe("POST /api/token-test (Security Check)", () => {
  test("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    mockVerifyAdminAccess.mockResolvedValue(false);

    const response = await POST();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("returns 401 when authenticated but not admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockVerifyAdminAccess.mockResolvedValue(false);

    const response = await POST();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("returns 200 when authenticated as admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-123", role: "ADMIN" } });
    mockVerifyAdminAccess.mockResolvedValue(true);

    const response = await POST();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
