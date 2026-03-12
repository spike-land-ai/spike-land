/**
 * Worker index.ts tests
 *
 * Tests the Cloudflare Worker fetch handler for health check,
 * webhook endpoint, and 404 fallback.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock handleWebhook and runReviewJob
const mockHandleWebhook = vi.fn();
const mockRunReviewJob = vi.fn();

vi.mock("../../../src/mcp-tools/code-review/worker/webhook-handler.js", () => ({
  handleWebhook: mockHandleWebhook,
}));

vi.mock("../../../src/mcp-tools/code-review/worker/review-job.js", () => ({
  runReviewJob: mockRunReviewJob,
}));

// Import the worker default export
const workerModule = await import("../../../src/mcp-tools/code-review/worker/index.js");
const worker = workerModule.default;

// Mock env
const mockEnv = {
  GITHUB_TOKEN: "ghp_test",
  GITHUB_WEBHOOK_SECRET: "secret",
  CLAUDE_CODE_OAUTH_TOKEN: "oauth_token",
};

// Mock execution context
const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

function makeRequest(url: string, method = "GET", body?: string): Request {
  return new Request(url, {
    method,
    body,
    headers: body ? { "content-type": "application/json" } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRunReviewJob.mockResolvedValue({ success: true, summary: "done" });
});

describe("Worker fetch handler", () => {
  describe("GET /health", () => {
    it("returns 200 with status ok", async () => {
      const req = makeRequest("https://example.com/health");
      const res = await worker.fetch(req, mockEnv, mockCtx);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ status: "ok", service: "spike-review" });
    });

    it("returns JSON content-type", async () => {
      const req = makeRequest("https://example.com/health");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.headers.get("content-type")).toBe("application/json");
    });

    it("returns version in health response", async () => {
      const req = makeRequest("https://example.com/health");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      const body = await res.json();
      expect(body).toHaveProperty("version");
    });
  });

  describe("POST /webhook", () => {
    it("calls handleWebhook and returns the result status", async () => {
      mockHandleWebhook.mockResolvedValue({
        status: 202,
        body: "Review queued",
        context: {
          owner: "org",
          repo: "repo",
          prNumber: 1,
          headSha: "abc123",
          action: "opened",
        },
      });

      const req = makeRequest("https://example.com/webhook", "POST", '{"test": true}');
      const res = await worker.fetch(req, mockEnv, mockCtx);

      expect(res.status).toBe(202);
      expect(mockHandleWebhook).toHaveBeenCalledWith(req, mockEnv);
    });

    it("returns the webhook response body as JSON", async () => {
      mockHandleWebhook.mockResolvedValue({
        status: 200,
        body: "Skipped: draft PR",
      });

      const req = makeRequest("https://example.com/webhook", "POST", "{}");
      const res = await worker.fetch(req, mockEnv, mockCtx);

      const body = await res.json();
      expect(body.message).toBe("Skipped: draft PR");
    });

    it("calls ctx.waitUntil when context is returned", async () => {
      const prContext = {
        owner: "org",
        repo: "repo",
        prNumber: 42,
        headSha: "sha123",
        action: "opened",
      };

      mockHandleWebhook.mockResolvedValue({
        status: 202,
        body: "Review queued",
        context: prContext,
      });

      const req = makeRequest("https://example.com/webhook", "POST", "{}");
      await worker.fetch(req, mockEnv, mockCtx);

      expect(mockCtx.waitUntil).toHaveBeenCalledTimes(1);
    });

    it("does not call ctx.waitUntil when no context returned", async () => {
      mockHandleWebhook.mockResolvedValue({
        status: 200,
        body: "Ignored event",
      });

      const req = makeRequest("https://example.com/webhook", "POST", "{}");
      await worker.fetch(req, mockEnv, mockCtx);

      expect(mockCtx.waitUntil).not.toHaveBeenCalled();
    });

    it("handles webhook error by returning the status", async () => {
      mockHandleWebhook.mockResolvedValue({
        status: 401,
        body: "Invalid signature",
      });

      const req = makeRequest("https://example.com/webhook", "POST", "{}");
      const res = await worker.fetch(req, mockEnv, mockCtx);

      expect(res.status).toBe(401);
    });

    it("runReviewJob error is caught by waitUntil callback", async () => {
      const prContext = {
        owner: "org",
        repo: "repo",
        prNumber: 1,
        headSha: "sha",
        action: "opened",
      };

      mockHandleWebhook.mockResolvedValue({
        status: 202,
        body: "Review queued",
        context: prContext,
      });

      mockRunReviewJob.mockRejectedValue(new Error("Job failed"));

      const req = makeRequest("https://example.com/webhook", "POST", "{}");
      await worker.fetch(req, mockEnv, mockCtx);

      // The waitUntil promise should handle the error internally (console.error)
      const waitUntilPromise = mockCtx.waitUntil.mock.calls[0]?.[0];
      const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      await expect(waitUntilPromise).resolves.toBeUndefined();
      mockConsoleError.mockRestore();
    });
  });

  describe("Unknown routes", () => {
    it("returns 404 for unknown path", async () => {
      const req = makeRequest("https://example.com/unknown");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(404);
    });

    it("returns 404 for GET /webhook", async () => {
      const req = makeRequest("https://example.com/webhook", "GET");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(404);
    });

    it("returns 404 for POST /health", async () => {
      const req = makeRequest("https://example.com/health", "POST");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(404);
    });

    it("returns Not found text for 404", async () => {
      const req = makeRequest("https://example.com/random");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      const text = await res.text();
      expect(text).toBe("Not found");
    });
  });
});
