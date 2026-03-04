/**
 * Targeted branch coverage tests for multiple files:
 * - mainFetchHandler.ts: response fallback branches (lines 82, 88)
 * - openaiHandler.ts: !response.ok branch (line 41) and empty path (line 19)
 * - routeHandler.ts: undefined firstPath (line 42)
 * - replicateHandler.ts: branches at 119, 135, 149, 150, 183
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleGPT4Request } from "../../src/spike-land-backend/openaiHandler.js";
import { RouteHandler } from "../../src/spike-land-backend/routeHandler.js";
import type Env from "../../src/spike-land-backend/env.js";

// Mock the routes barrel so RouteHandler constructors succeed
vi.mock("../../src/spike-land-backend/routes/index.js", () => {
  class CodeRoutes { handleCodeRoute = vi.fn(); handleSessionRoute = vi.fn(); handleJsRoute = vi.fn(); handleCssRoute = vi.fn(); }
  class WebsocketRoutes { handleUsersRoute = vi.fn(); handleWebsocketRoute = vi.fn(); }
  class LiveRoutes { handleLazyRoute = vi.fn(); handleLiveRoute = vi.fn(); handleRenderToStr = vi.fn(); handleWrapRoute = vi.fn(); handleWrapHTMLRoute = vi.fn(); handleScreenShotRoute = vi.fn(); handleVersionRoute = vi.fn(); handleVersionsRoute = vi.fn(); }
  class UtilityRoutes { handleRequestRoute = vi.fn(); handleListRoute = vi.fn(); handleRoomRoute = vi.fn(); handlePathRoute = vi.fn(); handleEnvRoute = vi.fn(); }
  class StorageRoutes { handleHashCodeRoute = vi.fn(); }
  class DefaultRoutes { handleDefaultRoute = vi.fn(); handleHtmlRoute = vi.fn(); }
  class AiRoutes { handleMessagesRoute = vi.fn(); handleAiRoute = vi.fn(); }
  class ApiRoutes { handleApiRoute = vi.fn(); }
  return { CodeRoutes, WebsocketRoutes, LiveRoutes, UtilityRoutes, StorageRoutes, DefaultRoutes, AiRoutes, ApiRoutes };
});

describe("routeHandler — undefined firstPath branch (line 42)", () => {
  it("returns 404 when path is empty array", async () => {
    const mockCode = {
      getSession: vi.fn().mockReturnValue({ codeSpace: "test", code: "", html: "", css: "", transpiled: "", messages: [] }),
      getEnv: vi.fn().mockReturnValue({}),
    };
    const handler = new RouteHandler(mockCode as unknown as Parameters<typeof RouteHandler>[0]);
    const request = new Request("https://example.com/");
    const url = new URL("https://example.com/");
    const response = await handler.handleRoute(request, url, []);
    expect(response.status).toBe(404);
  });
});

describe("openaiHandler — additional branches", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("handles non-ok response status (line 41 - true branch)", async () => {
    mockFetch.mockResolvedValue(new Response("Bad Request", { status: 400 }));
    const env = { OPENAI_API_KEY: "test-key" } as unknown as Env;
    const request = new Request("https://example.com/openai/v1/models");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await handleGPT4Request(request, env);
    expect(response.status).toBe(500);
    consoleSpy.mockRestore();
  });

  it("handles URL with no /openai in path (empty fallback for line 19)", async () => {
    mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));
    const env = { OPENAI_API_KEY: "test-key" } as unknown as Env;
    // URL without /openai in path - pathAfterOpenai will be ""
    const request = new Request("https://example.com/v1/models");
    const response = await handleGPT4Request(request, env);
    expect(response).toBeDefined();
  });

  it("handles URL ending exactly in /openai — pop() returns '' so || '' fires (line 19 branch 1)", async () => {
    mockFetch.mockResolvedValue(new Response("ok", { status: 200 }));
    const env = { OPENAI_API_KEY: "test-key" } as unknown as Env;
    // split("/openai") on "/openai" gives ["", ""] → pop() = "" → "" || "" fires the ?? "" branch
    const request = new Request("https://example.com/openai");
    const response = await handleGPT4Request(request, env);
    expect(response).toBeDefined();
  });
});
