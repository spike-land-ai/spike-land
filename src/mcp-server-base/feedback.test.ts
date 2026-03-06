import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerFeedbackTool } from "./feedback.js";
import { createMockServer } from "./index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("registerFeedbackTool", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("registers a feedback tool with defaults", async () => {
    const mockServer = createMockServer();
    registerFeedbackTool(mockServer as unknown as McpServer, { serviceName: "test-service" });

    expect(mockServer.handlers.has("report_bug")).toBe(true);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "bug-123" }),
    } as unknown as Response);

    const result = await mockServer.call("report_bug", {
      title: "Test bug",
      description: "It is broken",
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("bug-123");

    expect(fetch).toHaveBeenCalledWith("https://spike.land/api/bugbook/report", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_name: "test-service",
        title: "Test bug",
        description: "It is broken",
      }),
    }));
  });

  it("handles fetch errors", async () => {
    const mockServer = createMockServer();
    registerFeedbackTool(mockServer as unknown as McpServer, { serviceName: "test-service" });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    } as unknown as Response);

    const result = await mockServer.call("report_bug", {
      title: "Test",
      description: "Desc",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("FEEDBACK_FAILED");
    expect(result.content[0].text).toContain("500 Internal Server Error");
  });
});
