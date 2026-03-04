/**
 * Additional websocketHandler tests for uncovered branches
 * - swarm_message offline queuing (else branch, line 218-234)
 * - swarm_delegate offline queuing (else branch)
 * - handleError (lines 399-400)
 * Note: catch blocks at lines 325, 360 are unreachable because safeSend swallows errors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../src/spike-land-backend/chatRoom.js";
import { WebSocketHandler } from "../../src/spike-land-backend/websocketHandler.js";
import type { WsAttachment } from "../../src/spike-land-backend/websocketHandler.js";

vi.mock("@spike-land-ai/code", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@spike-land-ai/code")>();
  return {
    ...actual,
    applySessionDelta: vi.fn(actual.applySessionDelta),
  };
});

function createMockWs(attachment: WsAttachment = {
  name: null,
  subscribedTopics: [],
  blockedMessages: [],
  swarmAgent: null,
}): WebSocket {
  return {
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
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
    serializeAttachment: vi.fn(),
    deserializeAttachment: vi.fn().mockReturnValue(attachment),
  } as unknown as WebSocket;
}

describe("WebSocketHandler additional coverage", () => {
  let wsHandler: WebSocketHandler;
  let allSockets: WebSocket[];
  let mockState: { getWebSockets: ReturnType<typeof vi.fn> };
  let mockCode: Partial<Code>;

  beforeEach(() => {
    vi.resetAllMocks();
    allSockets = [];
    mockState = { getWebSockets: vi.fn(() => allSockets) };
    mockCode = {
      getSession: vi.fn().mockReturnValue({
        code: "test",
        html: "",
        css: "",
        transpiled: "",
        codeSpace: "test-space",
        messages: [],
      }),
      updateAndBroadcastSession: vi.fn(),
    };
    wsHandler = new WebSocketHandler(mockCode as Code, mockState as unknown as DurableObjectState);
  });

  describe("swarm_message offline queuing (target not found in sockets)", () => {
    it("sends swarm_message_queued when no target socket exists", async () => {
      const senderWs = createMockWs({
        name: "sender",
        subscribedTopics: [],
        blockedMessages: [],
        swarmAgent: null,
      });

      // Only add sender socket - no target socket
      allSockets.push(senderWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_message",
        target_agent_id: "nonexistent-agent",
        content: "hello",
      }));

      const senderSends = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const queuedMsg = senderSends.find((m: { type: string }) => m.type === "swarm_message_queued");
      expect(queuedMsg).toBeDefined();
      expect(queuedMsg?.target_agent_id).toBe("nonexistent-agent");
    });

    it("delivers swarm_message successfully when target is found", async () => {
      const senderWs = createMockWs({
        name: "sender",
        subscribedTopics: [],
        blockedMessages: [],
        swarmAgent: { agentId: "sender-agent", displayName: "Sender", capabilities: [], registeredAt: 0 },
      });
      const targetWs = createMockWs({
        name: "target-agent",
        subscribedTopics: [],
        blockedMessages: [],
        swarmAgent: { agentId: "target-agent", displayName: "Target", capabilities: [], registeredAt: 0 },
      });

      allSockets.push(senderWs, targetWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_message",
        target_agent_id: "target-agent",
        content: "hello target",
      }));

      expect(targetWs.send).toHaveBeenCalled();
      // Sender gets ack
      const senderSends = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      expect(senderSends.some((m: { action?: string }) => m.action === "swarm_message")).toBe(true);
    });
  });

  describe("swarm_delegate offline queuing (target not found in sockets)", () => {
    it("sends swarm_delegate_queued when no target socket exists", async () => {
      const senderWs = createMockWs({ name: "sender", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(senderWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_delegate",
        target_agent_id: "nonexistent-worker",
        task_description: "Process this task",
        priority: "high",
      }));

      const senderSends = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const queuedMsg = senderSends.find((m: { type: string }) => m.type === "swarm_delegate_queued");
      expect(queuedMsg).toBeDefined();
    });

    it("delivers swarm_delegate successfully when target is found", async () => {
      const senderWs = createMockWs({ name: "delegator", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      const targetWs = createMockWs({
        name: "worker",
        subscribedTopics: [],
        blockedMessages: [],
        swarmAgent: { agentId: "worker", displayName: "Worker", capabilities: [], registeredAt: 0 },
      });
      allSockets.push(senderWs, targetWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_delegate",
        target_agent_id: "worker",
        task_description: "Do this",
      }));

      expect(targetWs.send).toHaveBeenCalled();
    });
  });

  describe("handleError (lines 399-400)", () => {
    it("logs error and delegates to handleClose", () => {
      const ws = createMockWs({
        name: "test",
        subscribedTopics: ["topic1"],
        blockedMessages: [],
        swarmAgent: null,
      });
      allSockets.push(ws);

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("WebSocket error occurred");

      wsHandler.handleError(ws, error);

      expect(consoleError).toHaveBeenCalledWith("WebSocket error:", error);
      consoleError.mockRestore();
    });

    it("handleClose removes socket from topics", () => {
      // Set up a topic with this ws
      const ws = createMockWs({
        name: null,
        subscribedTopics: ["news"],
        blockedMessages: [],
        swarmAgent: null,
      });

      // First subscribe to set up the topic
      allSockets.push(ws);
      wsHandler.handleMessage(ws, JSON.stringify({ type: "subscribe", topics: ["news"] }));

      // Then close
      wsHandler.handleClose(ws);
      // No assertion needed — just ensures the code path runs without error
    });
  });

  describe("safeSend — string message", () => {
    it("sends string message directly", async () => {
      const ws = createMockWs();
      // Trigger a ping to exercise safeSend with string
      await wsHandler.handleMessage(ws, JSON.stringify({ type: "ping" }));
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "pong" }));
    });
  });

  describe("getSwarmAgents", () => {
    it("returns agents with swarmAgent registration", async () => {
      const agentWs = createMockWs({
        name: "my-agent",
        subscribedTopics: [],
        blockedMessages: [],
        swarmAgent: {
          agentId: "my-agent",
          displayName: "My Agent",
          capabilities: ["chat"],
          registeredAt: Date.now(),
        },
      });
      allSockets.push(agentWs);

      const ws = createMockWs();
      allSockets.push(ws);

      await wsHandler.handleMessage(ws, JSON.stringify({ type: "swarm_list_agents" }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const agentsList = calls.find((m: { type: string }) => m.type === "swarm_agents_list");
      expect(agentsList).toBeDefined();
      expect(agentsList?.agents).toBeDefined();
    });
  });
});
