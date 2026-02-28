import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockApproveQRAuth = vi.hoisted(() => vi.fn());
const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/qr-auth-service", () => ({
  approveQRAuth: mockApproveQRAuth,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/qr/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/qr/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "authenticated-user-123" },
    });
    mockApproveQRAuth.mockResolvedValue({
      hash: "a".repeat(64),
      oneTimeCode: "one-time-code-value",
    });
  });

  it("returns success when authenticated user approves a valid QR session", async () => {
    const request = makeRequest({ token: "valid-qr-token" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; };
    expect(body.success).toBe(true);
  });

  it("calls approveQRAuth with token and authenticated userId", async () => {
    const request = makeRequest({ token: "valid-qr-token" });
    await POST(request);

    expect(mockApproveQRAuth).toHaveBeenCalledWith("valid-qr-token", "authenticated-user-123");
  });

  it("returns 401 when user is not authenticated (no session)", async () => {
    mockAuth.mockResolvedValue(null);

    const request = makeRequest({ token: "valid-qr-token" });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Authentication required");
    expect(mockApproveQRAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when session has no user", async () => {
    mockAuth.mockResolvedValue({ user: null });

    const request = makeRequest({ token: "valid-qr-token" });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mockApproveQRAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when session user has no id", async () => {
    mockAuth.mockResolvedValue({ user: { id: undefined } });

    const request = makeRequest({ token: "valid-qr-token" });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mockApproveQRAuth).not.toHaveBeenCalled();
  });

  it("returns 400 when token is missing from request body", async () => {
    const request = makeRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Missing token");
    expect(mockApproveQRAuth).not.toHaveBeenCalled();
  });

  it("returns 400 when QR session is invalid or expired", async () => {
    mockApproveQRAuth.mockResolvedValue(null);

    const request = makeRequest({ token: "invalid-or-expired-token" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; };
    expect(body.error).toBe("Invalid or expired QR session");
  });

  it("returns 400 when QR session is already approved (not PENDING)", async () => {
    mockApproveQRAuth.mockResolvedValue(null);

    const request = makeRequest({ token: "already-approved-token" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("does not expose oneTimeCode or hash in response", async () => {
    const request = makeRequest({ token: "valid-qr-token" });
    const response = await POST(request);

    const body = await response.json() as Record<string, unknown>;
    expect(body.oneTimeCode).toBeUndefined();
    expect(body.hash).toBeUndefined();
  });
});
