import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.hoisted(() => ({
  authenticateMcpRequest: vi.fn(),
}));

const mockPrisma = vi.hoisted(() => ({
  agentTask: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  box: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/mcp/auth", () => mockAuth);
vi.mock("@/lib/prisma", () => ({ default: mockPrisma }));

import { POST } from "./route";

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/agent/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/agent/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.authenticateMcpRequest.mockResolvedValue({
      success: true,
      userId: "user-123",
    });
  });

  it("accepts valid result payloads", async () => {
    mockPrisma.agentTask.findUnique.mockResolvedValue({
      id: "task-1",
      box: { userId: "user-123" },
    });
    mockPrisma.agentTask.update.mockResolvedValue({ id: "task-1" });

    const res = await POST(makePostRequest({
      taskId: "task-1",
      status: "COMPLETED",
      result: { foo: "bar", baz: 123 },
    }));

    expect(res.status).toBe(200);
  });

  it("rejects malformed result payloads (e.g. array instead of object)", async () => {
    const res = await POST(makePostRequest({
      taskId: "task-1",
      status: "COMPLETED",
      result: ["this", "is", "an", "array"],
    }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
  });

  it("rejects scalar result payloads", async () => {
    const res = await POST(makePostRequest({
      taskId: "task-1",
      status: "COMPLETED",
      result: "just a string",
    }));

    expect(res.status).toBe(400);
  });
});
