/**
 * Tests for @spike-land-ai/mcp-server-base — feedback.ts
 */

import { describe, expect, it, vi } from "vitest";
import {
  createMockServer,
  getText,
  isErrorResult,
} from "../../src/mcp-server-base/index.js";
import {
  type FeedbackReport,
  createHttpReportFn,
  registerFeedbackTool,
} from "../../src/mcp-server-base/feedback.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Alias to avoid unused-import complaint
type McpServerType = McpServer;

// ─── registerFeedbackTool ─────────────────────────────────────────────────────

describe("registerFeedbackTool", () => {
  it("registers a tool named <prefix>_feedback", () => {
    const server = createMockServer();
    registerFeedbackTool(server as unknown as McpServerType, {
      prefix: "my_service",
      serviceName: "mcp-my-service",
      reportFn: vi.fn(),
    });
    expect(server.handlers.has("my_service_feedback")).toBe(true);
  });

  it("returns a success result with bugId for a new bug", async () => {
    const reportFn = vi.fn().mockResolvedValue({ bugId: "BUG-001", isNewBug: true });
    const server = createMockServer();

    registerFeedbackTool(server as unknown as McpServerType, {
      prefix: "img",
      serviceName: "mcp-image-studio",
      reportFn,
    });

    const result = await server.call("img_feedback", {
      title: "Image fails to load",
      description: "The image generation endpoint returns 500",
      severity: "high",
    });

    expect(isErrorResult(result)).toBe(false);
    const parsed = JSON.parse(getText(result)) as {
      status: string;
      bugId: string;
      isNewBug: boolean;
      message: string;
    };
    expect(parsed.status).toBe("reported");
    expect(parsed.bugId).toBe("BUG-001");
    expect(parsed.isNewBug).toBe(true);
    expect(parsed.message).toContain("New bug reported");
    expect(parsed.message).toContain("BUG-001");
  });

  it("returns a success result with known-bug message when isNewBug is false", async () => {
    const reportFn = vi.fn().mockResolvedValue({ bugId: "BUG-007", isNewBug: false });
    const server = createMockServer();

    registerFeedbackTool(server as unknown as McpServerType, {
      prefix: "svc",
      serviceName: "mcp-svc",
      reportFn,
    });

    const result = await server.call("svc_feedback", {
      title: "Known crash on startup",
      description: "App crashes immediately when opened in production",
      severity: "critical",
    });

    expect(isErrorResult(result)).toBe(false);
    const parsed = JSON.parse(getText(result)) as { message: string };
    expect(parsed.message).toContain("Bug confirmed");
    expect(parsed.message).toContain("BUG-007");
  });

  it("passes optional fields through to reportFn", async () => {
    const reportFn = vi.fn().mockResolvedValue({ bugId: "BUG-002", isNewBug: true });
    const server = createMockServer();

    registerFeedbackTool(server as unknown as McpServerType, {
      prefix: "svc",
      serviceName: "mcp-svc",
      reportFn,
    });

    await server.call("svc_feedback", {
      title: "Crash on login page",
      description: "Entering credentials causes a white screen",
      severity: "medium",
      reproduction_steps: "1. Go to /login\n2. Enter credentials\n3. Click submit",
      error_code: "ERR_500",
      metadata: { browser: "Chrome", version: "120" },
    });

    const calledReport = reportFn.mock.calls[0][0] as FeedbackReport;
    expect(calledReport.reproduction_steps).toBe("1. Go to /login\n2. Enter credentials\n3. Click submit");
    expect(calledReport.error_code).toBe("ERR_500");
    expect(calledReport.metadata).toEqual({ browser: "Chrome", version: "120" });
    expect(calledReport.service_name).toBe("mcp-svc");
  });

  it("returns a FEEDBACK_ERROR result when reportFn throws an Error", async () => {
    const reportFn = vi.fn().mockRejectedValue(new Error("network timeout"));
    const server = createMockServer();

    registerFeedbackTool(server as unknown as McpServerType, {
      prefix: "svc",
      serviceName: "mcp-svc",
      reportFn,
    });

    const result = await server.call("svc_feedback", {
      title: "Upload button broken",
      description: "Clicking upload does nothing in the UI",
      severity: "low",
    });

    expect(isErrorResult(result)).toBe(true);
    expect(getText(result)).toContain("FEEDBACK_ERROR");
    expect(getText(result)).toContain("network timeout");
  });

  it("returns a FEEDBACK_ERROR result when reportFn throws a non-Error", async () => {
    const reportFn = vi.fn().mockRejectedValue("plain string error");
    const server = createMockServer();

    registerFeedbackTool(server as unknown as McpServerType, {
      prefix: "svc",
      serviceName: "mcp-svc",
      reportFn,
    });

    const result = await server.call("svc_feedback", {
      title: "Something broke badly",
      description: "The entire service is unresponsive after deployment",
      severity: "critical",
    });

    expect(isErrorResult(result)).toBe(true);
    expect(getText(result)).toContain("FEEDBACK_ERROR");
    expect(getText(result)).toContain("plain string error");
  });
});

// ─── createHttpReportFn ───────────────────────────────────────────────────────

describe("createHttpReportFn", () => {
  it("POSTs to the default bugbook URL and returns parsed JSON", async () => {
    const mockResponse = { bugId: "BUG-999", isNewBug: true };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as Response);

    const reportFn = createHttpReportFn();
    const report: FeedbackReport = {
      title: "Test bug",
      description: "Test description text here",
      service_name: "test-service",
      severity: "low",
    };

    const result = await reportFn(report);
    expect(result).toEqual(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://edge.spike.land/bugbook/report",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify(report),
      }),
    );

    fetchSpy.mockRestore();
  });

  it("accepts a custom base URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ bugId: "X", isNewBug: false }),
    } as unknown as Response);

    const reportFn = createHttpReportFn("https://custom.example.com");
    await reportFn({
      title: "My bug title here",
      description: "Detailed bug description for testing",
      service_name: "svc",
      severity: "medium",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://custom.example.com/bugbook/report",
      expect.anything(),
    );

    fetchSpy.mockRestore();
  });

  it("merges extra headers into the request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ bugId: "Y", isNewBug: true }),
    } as unknown as Response);

    const reportFn = createHttpReportFn("https://edge.spike.land", {
      Authorization: "Bearer token123",
    });
    await reportFn({
      title: "Auth bug report title",
      description: "Auth flow breaks on second login attempt",
      service_name: "auth-svc",
      severity: "high",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token123",
          "Content-Type": "application/json",
        }),
      }),
    );

    fetchSpy.mockRestore();
  });

  it("throws when the API returns a non-ok response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      text: vi.fn().mockResolvedValue("Unprocessable Entity"),
    } as unknown as Response);

    const reportFn = createHttpReportFn();
    await expect(
      reportFn({
        title: "Another test bug",
        description: "Testing error path for the HTTP report function",
        service_name: "svc",
        severity: "low",
      }),
    ).rejects.toThrow("Bugbook API error (422): Unprocessable Entity");

    fetchSpy.mockRestore();
  });
});
