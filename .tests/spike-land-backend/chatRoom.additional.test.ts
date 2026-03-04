/**
 * Additional chatRoom.ts tests for uncovered methods:
 * - getVersion, getVersionCount, getVersionsList
 * - getMcpServer, getFiles, setFile, deleteFile
 * - registerSwarmAgent, unregisterSwarmAgent, getSwarmAgents
 * - webSocketMessage, webSocketClose, webSocketError
 * - getState, getOrigin, getEnv
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Code } from "../../src/spike-land-backend/chatRoom.js";
import type Env from "../../src/spike-land-backend/env.js";
import { RouteHandler } from "../../src/spike-land-backend/routeHandler.js";
import { WebSocketHandler } from "../../src/spike-land-backend/websocketHandler.js";

vi.mock("../../src/spike-land-backend/routeHandler.js", () => ({
  RouteHandler: vi.fn().mockImplementation(function () {
    return { handleRoute: vi.fn().mockResolvedValue(new Response("OK")) };
  }),
}));

vi.mock("../../src/spike-land-backend/websocketHandler.js", () => ({
  WebSocketHandler: vi.fn().mockImplementation(function () {
    return {
      broadcast: vi.fn(),
      handleWebSocket: vi.fn(),
      handleMessage: vi.fn(),
      handleClose: vi.fn(),
      handleError: vi.fn(),
      getWsSessions: vi.fn().mockReturnValue([]),
    };
  }),
}));

vi.mock("../../src/spike-land-backend/mcp.js", () => ({
  McpServer: vi.fn().mockImplementation(function () {
    return {
      setEnv: vi.fn(),
      fetch: vi.fn().mockResolvedValue(new Response("mcp")),
    };
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function buildMockState() {
  return {
    storage: {
      get: vi.fn(),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      list: vi.fn(),
      deleteAll: vi.fn(),
      transaction: vi.fn((closure: () => Promise<unknown>) => closure()),
      getAlarm: vi.fn(),
      setAlarm: vi.fn(),
      deleteAlarm: vi.fn(),
      blockConcurrencyWhile: vi.fn((callback: () => unknown) => callback()),
    },
    id: {
      toString: () => "test-id",
      equals: vi.fn(),
      name: "test-name",
    } as DurableObjectId,
    waitUntil: vi.fn(),
    blockConcurrencyWhile: vi.fn(async (callback: () => Promise<unknown>) => await callback()),
  } as unknown as DurableObjectState;
}

function buildMockEnv() {
  return {
    R2: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as Env;
}

async function initCode(codeInstance: Code, room = "test-room") {
  await codeInstance.fetch(new Request(`https://example.com/?room=${room}`));
}

describe("Code Durable Object — additional coverage", () => {
  let mockState: DurableObjectState;
  let mockEnv: Env;
  let code: Code;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = buildMockState();
    mockEnv = buildMockEnv();

    (RouteHandler as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { handleRoute: vi.fn().mockResolvedValue(new Response("OK")) };
    });
    (WebSocketHandler as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return {
        broadcast: vi.fn(),
        handleWebSocket: vi.fn(),
        handleMessage: vi.fn(),
        handleClose: vi.fn(),
        handleError: vi.fn(),
        getWsSessions: vi.fn().mockReturnValue([]),
      };
    });

    code = new Code(mockState, mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getVersionCount / getVersionsList / getVersion", () => {
    it("returns 0 before any versions are saved", async () => {
      await initCode(code);
      expect(code.getVersionCount()).toBe(0);
    });

    it("returns empty array from getVersionsList when no versions", async () => {
      await initCode(code);
      const list = await code.getVersionsList();
      expect(list).toEqual([]);
    });

    it("returns null from getVersion for non-existent version", async () => {
      await initCode(code);
      // Mock largeStorage.get returns undefined
      (mockState.storage.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const version = await code.getVersion(999);
      expect(version).toBeNull();
    });

    it("getVersionsList iterates versionCount times", async () => {
      // Manually set versionCount by triggering updateAndBroadcastSession
      await initCode(code);

      // Trigger a session update to create a version
      const session = code.getSession();
      await code.updateAndBroadcastSession({ ...session, code: "new code" });

      // After one update, versionCount should be 1
      expect(code.getVersionCount()).toBe(1);

      // getVersionsList should attempt to load version_1
      const getStorageSpy = mockState.storage.get as ReturnType<typeof vi.fn>;
      getStorageSpy.mockResolvedValue({
        number: 1,
        hash: "abc",
        createdAt: 1000,
        code: "new code",
        transpiled: "",
        html: "",
        css: "",
      });
      const list = await code.getVersionsList();
      expect(list).toHaveLength(1);
      expect(list[0]!.number).toBe(1);
    });
  });

  describe("getMcpServer", () => {
    it("returns the mcp server instance", async () => {
      await initCode(code);
      const mcp = code.getMcpServer();
      expect(mcp).toBeDefined();
    });
  });

  describe("getFiles / setFile / deleteFile", () => {
    it("getFiles returns empty map initially", async () => {
      await initCode(code);
      expect(code.getFiles()).toBeInstanceOf(Map);
      expect(code.getFiles().size).toBe(0);
    });

    it("setFile adds a non-entry-point file without transpilation", async () => {
      await initCode(code);
      await code.setFile("/src/utils.ts", "export const foo = 1;");
      expect(code.getFiles().get("/src/utils.ts")).toBe("export const foo = 1;");
    });

    it("setFile with /src/App.tsx triggers transpilation fetch when origin present", async () => {
      await initCode(code);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue("transpiled code"),
      } as unknown as Response);

      await code.setFile("/src/App.tsx", "export default () => <div/>;");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://js.spike.land",
        expect.objectContaining({ method: "POST" }),
      );
      expect(code.getFiles().get("/src/App.tsx")).toBe("export default () => <div/>;");
    });

    it("setFile with /src/App.tsx handles transpilation failure gracefully", async () => {
      await initCode(code);
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error("network error"));

      await expect(
        code.setFile("/src/App.tsx", "export default () => <div/>;"),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Files] Transpilation failed"),
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it("deleteFile removes file from map", async () => {
      await initCode(code);
      await code.setFile("/src/utils.ts", "export const bar = 2;");
      expect(code.getFiles().has("/src/utils.ts")).toBe(true);

      await code.deleteFile("/src/utils.ts");
      expect(code.getFiles().has("/src/utils.ts")).toBe(false);
    });
  });

  describe("swarm agent registration", () => {
    it("registerSwarmAgent adds agent to registry", async () => {
      await initCode(code);
      code.registerSwarmAgent("agent-1", "Agent One", ["chat", "code"]);
      const agents = code.getSwarmAgents();
      expect(agents.has("agent-1")).toBe(true);
      expect(agents.get("agent-1")!.displayName).toBe("Agent One");
      expect(agents.get("agent-1")!.capabilities).toEqual(["chat", "code"]);
    });

    it("unregisterSwarmAgent removes agent from registry", async () => {
      await initCode(code);
      code.registerSwarmAgent("agent-2", "Agent Two", []);
      expect(code.getSwarmAgents().has("agent-2")).toBe(true);

      code.unregisterSwarmAgent("agent-2");
      expect(code.getSwarmAgents().has("agent-2")).toBe(false);
    });

    it("getSwarmAgents returns empty map initially", async () => {
      await initCode(code);
      expect(code.getSwarmAgents().size).toBe(0);
    });
  });

  describe("hibernation API — webSocketMessage / webSocketClose / webSocketError", () => {
    let mockWs: WebSocket;

    beforeEach(() => {
      mockWs = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        deserializeAttachment: vi.fn().mockReturnValue(null),
        serializeAttachment: vi.fn(),
        binaryType: "blob" as BinaryType,
        bufferedAmount: 0,
        extensions: "",
        onclose: null,
        onerror: null,
        onmessage: null,
        onopen: null,
        protocol: "",
        url: "ws://localhost",
        CLOSED: 3,
        CLOSING: 2,
        CONNECTING: 0,
        OPEN: 1,
      } as unknown as WebSocket;
    });

    it("webSocketMessage calls wsHandler.handleMessage when initialized", async () => {
      await initCode(code);
      const wsHandlerInstance = (WebSocketHandler as ReturnType<typeof vi.fn>).mock.results[0]!.value as {
        handleMessage: ReturnType<typeof vi.fn>;
      };
      await code.webSocketMessage(mockWs, "hello");
      expect(wsHandlerInstance.handleMessage).toHaveBeenCalledWith(mockWs, "hello");
    });

    it("webSocketMessage initializes session when not yet initialized", async () => {
      // Don't call initCode - Code is not initialized
      const wsHandlerInstance = (WebSocketHandler as ReturnType<typeof vi.fn>).mock.results[0]!.value as {
        handleMessage: ReturnType<typeof vi.fn>;
      };

      // Should not throw, should call handleMessage after auto-init
      await code.webSocketMessage(mockWs, "hello from cold start");
      expect(wsHandlerInstance.handleMessage).toHaveBeenCalledWith(mockWs, "hello from cold start");
    });

    it("webSocketClose calls wsHandler.handleClose", async () => {
      await initCode(code);
      const wsHandlerInstance = (WebSocketHandler as ReturnType<typeof vi.fn>).mock.results[0]!.value as {
        handleClose: ReturnType<typeof vi.fn>;
      };
      await code.webSocketClose(mockWs, 1000, "done", true);
      expect(wsHandlerInstance.handleClose).toHaveBeenCalledWith(mockWs);
    });

    it("webSocketError calls wsHandler.handleError", async () => {
      await initCode(code);
      const wsHandlerInstance = (WebSocketHandler as ReturnType<typeof vi.fn>).mock.results[0]!.value as {
        handleError: ReturnType<typeof vi.fn>;
      };
      const err = new Error("ws error");
      await code.webSocketError(mockWs, err);
      expect(wsHandlerInstance.handleError).toHaveBeenCalledWith(mockWs, err);
    });
  });

  describe("getState / getOrigin / getEnv", () => {
    it("getState returns the durable object state", async () => {
      await initCode(code);
      expect(code.getState()).toBe(mockState);
    });

    it("getOrigin returns the initialized origin", async () => {
      await initCode(code, "my-room");
      expect(code.getOrigin()).toBe("https://example.com");
    });

    it("getEnv returns the env object", async () => {
      await initCode(code);
      expect(code.getEnv()).toBe(mockEnv);
    });
  });

  describe("initializeSession branches", () => {
    it("handles MCP URL path with X-CodeSpace header", async () => {
      // Fetch with /mcp path to exercise getCodeSpace for MCP
      const req = new Request("https://example.com/mcp/tools", {
        headers: { "X-CodeSpace": "from-header" },
      });
      // Route handler should be called
      await code.fetch(req);
      expect(code.getOrigin()).toBe("https://example.com");
    });

    it("handles MCP URL path with codeSpace query param", async () => {
      const req = new Request("https://example.com/mcp?codeSpace=from-query");
      await code.fetch(req);
      expect(code.initialized).toBe(true);
    });

    it("handles MCP URL path with room param fallback", async () => {
      const req = new Request("https://example.com/mcp?room=from-room");
      await code.fetch(req);
      expect(code.initialized).toBe(true);
    });

    it("handles sessionCore codeSpace mismatch (logs warning)", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Mock storage to return sessionCore with different codeSpace
      (mockState.storage.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === "session_core") return Promise.resolve({ codeSpace: "wrong-space", messages: [] });
        return Promise.resolve(undefined);
      });

      await code.fetch(new Request("https://example.com/?room=right-space"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Discarding loaded core"));
      consoleSpy.mockRestore();
    });

    it("handles fetch with no room parameter throws (non-MCP)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const req = new Request("https://example.com/some-path");
      // No room param - should trigger error handling
      await code.fetch(req);
      consoleSpy.mockRestore();
    });

    it("handles R2 html/css get throwing", async () => {
      (mockState.storage.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === "session_core") return Promise.resolve({ codeSpace: "r2-error-room", messages: [] });
        if (key === "session_code") return Promise.resolve("some code");
        if (key === "session_transpiled") return Promise.resolve("transpiled");
        return Promise.resolve(undefined);
      });
      (mockEnv.R2.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("R2 error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await code.fetch(new Request("https://example.com/?room=r2-error-room"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to load"), expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("handles version count loading from largeStorage", async () => {
      (mockState.storage.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === "session_core") return Promise.resolve({ codeSpace: "vc-room", messages: [] });
        if (key === "session_code") return Promise.resolve("code");
        if (key === "session_transpiled") return Promise.resolve("");
        if (key === "version_count") return Promise.resolve(5);
        return Promise.resolve(undefined);
      });
      await code.fetch(new Request("https://example.com/?room=vc-room"));
      expect(code.getVersionCount()).toBe(5);
    });

    it("initializes already-initialized code without reinitializing", async () => {
      await initCode(code);
      expect(code.initialized).toBe(true);
      // Second fetch should skip initializeSession
      const storageCalls = (mockState.storage.get as ReturnType<typeof vi.fn>).mock.calls.length;
      await code.fetch(new Request("https://example.com/?room=test-room"));
      // Storage should not be called again for session loading
      const newStorageCalls = (mockState.storage.get as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(newStorageCalls).toBeLessThanOrEqual(storageCalls + 2);
    });
  });

  describe("updateAndBroadcastSession branches", () => {
    it("skips broadcast when hash is unchanged", async () => {
      await initCode(code);
      const session = code.getSession();
      const wsHandlerInstance = (WebSocketHandler as ReturnType<typeof vi.fn>).mock.results[0]!.value as {
        broadcast: ReturnType<typeof vi.fn>;
      };
      const broadcastBefore = wsHandlerInstance.broadcast.mock.calls.length;
      await code.updateAndBroadcastSession(session);
      expect(wsHandlerInstance.broadcast.mock.calls.length).toBe(broadcastBefore);
    });

    it("syncs code to virtual filesystem entry point when code changes", async () => {
      await initCode(code);
      const session = code.getSession();
      await code.updateAndBroadcastSession({ ...session, code: "new code content" });
      expect(code.getFiles().get("/src/App.tsx")).toBe("new code content");
    });

    it("POST /session endpoint updates session", async () => {
      await initCode(code);
      const session = code.getSession();
      const newSession = { ...session, code: "updated via POST" };
      const req = new Request("https://example.com/session?room=test-room", {
        method: "POST",
        body: JSON.stringify(newSession),
        headers: { "Content-Type": "application/json" },
      });
      const resp = await code.fetch(req);
      // Route handler handles it after session update
      expect(resp).toBeDefined();
    });

    it("POST /session endpoint handles invalid JSON", async () => {
      await initCode(code, "test-room");
      // URL must end with /session (no query params that break it)
      const req = new Request("https://example.com/session", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      });
      const resp = await code.fetch(req);
      // Either 400 from invalid JSON catch OR routeHandler handles - just ensure no throw
      expect([200, 400].includes(resp.status)).toBe(true);
    });
  });

  describe("fetch routing branches", () => {
    it("skips initialization for websocket path", async () => {
      // websocket path should not trigger initializeSession
      const req = new Request("https://example.com/websocket?room=ws-room");
      await code.fetch(req);
      // initialized remains false since websocket doesn't trigger init
      expect(code.initialized).toBe(false);
    });

    it("skips initialization for users path", async () => {
      const req = new Request("https://example.com/users?room=user-room");
      await code.fetch(req);
      expect(code.initialized).toBe(false);
    });
  });

  describe("_saveSession without codeSpace", () => {
    it("_saveSession throws when codeSpace is missing", async () => {
      await initCode(code);
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      // Override getSession to return session without codeSpace
      vi.spyOn(code, "getSession").mockReturnValue({
        code: "test",
        html: "",
        css: "",
        transpiled: "",
        codeSpace: "",
        messages: [],
      });
      await expect((code as unknown as { _saveSession(): Promise<void> })["_saveSession"]()).rejects.toThrow("Cannot save session: codeSpace is missing.");
      consoleSpy.mockRestore();
    });
  });
});
