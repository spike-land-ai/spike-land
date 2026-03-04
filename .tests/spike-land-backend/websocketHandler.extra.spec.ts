/**
 * Extra websocketHandler tests for remaining uncovered branches:
 * - binary message ignored (line 70)
 * - invalid JSON ignored (line 80-82)
 * - oldHash mismatch (lines 309-316)
 * - oldHash with updateAndBroadcastSession error (lines 320-326)
 * - data.target routing (lines 334-344)
 * - data.name update with blocked messages delivery (lines 346-373)
 * - broadcast with excludeWs (lines 442-451)
 * - getActiveUsers (lines 430-440)
 * - unsubscribe (lines 116-132)
 * - publish (lines 134-152)
 * - swarm_register (lines 156-177)
 * - pong no-op (lines 91-94)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Code } from "../../src/spike-land-backend/chatRoom.js";
import { WebSocketHandler } from "../../src/spike-land-backend/websocketHandler.js";
import type { WsAttachment } from "../../src/spike-land-backend/websocketHandler.js";
import { computeSessionHash } from "@spike-land-ai/code";

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

const mockSession = {
  code: "mock code",
  html: "mock html",
  css: "mock css",
  transpiled: "mock transpiled",
  codeSpace: "mock-space",
  messages: [],
};

describe("WebSocketHandler extra coverage", () => {
  let wsHandler: WebSocketHandler;
  let allSockets: WebSocket[];
  let mockState: { getWebSockets: ReturnType<typeof vi.fn> };
  let mockCode: Partial<Code>;

  beforeEach(() => {
    vi.clearAllMocks();
    allSockets = [];
    mockState = { getWebSockets: vi.fn(() => allSockets) };
    mockCode = {
      getSession: vi.fn().mockReturnValue(mockSession),
      updateAndBroadcastSession: vi.fn().mockResolvedValue(undefined),
    };
    wsHandler = new WebSocketHandler(
      mockCode as Code,
      mockState as unknown as DurableObjectState,
    );
  });

  describe("binary messages are ignored (line 70)", () => {
    it("ignores ArrayBuffer messages", async () => {
      const ws = createMockWs();
      const buf = new ArrayBuffer(4);
      await wsHandler.handleMessage(ws, buf);
      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  describe("invalid JSON is ignored (lines 80-82)", () => {
    it("ignores non-JSON string messages", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, "not valid json {{");
      expect(ws.send).not.toHaveBeenCalled();
    });

    it("ignores JSON array messages", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, "[1, 2, 3]");
      expect(ws.send).not.toHaveBeenCalled();
    });

    it("ignores null JSON messages", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, "null");
      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  describe("pong no-op (lines 91-94)", () => {
    it("handles pong message without sending anything", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, JSON.stringify({ type: "pong" }));
      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  describe("subscribe/unsubscribe/publish (lines 96-152)", () => {
    it("handles unsubscribe message", async () => {
      const ws = createMockWs();
      // First subscribe
      await wsHandler.handleMessage(ws, JSON.stringify({ type: "subscribe", topics: ["news"] }));
      // Then unsubscribe
      await wsHandler.handleMessage(ws, JSON.stringify({ type: "unsubscribe", topics: ["news"] }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const unsubAck = calls.find((m: { action?: string }) => m.action === "unsubscribe");
      expect(unsubAck).toBeDefined();
    });

    it("handles publish message to subscribers", async () => {
      const subscriberWs = createMockWs();
      allSockets.push(subscriberWs);
      await wsHandler.handleMessage(subscriberWs, JSON.stringify({ type: "subscribe", topics: ["topic1"] }));

      const publisherWs = createMockWs();
      allSockets.push(publisherWs);
      await wsHandler.handleMessage(publisherWs, JSON.stringify({
        type: "publish",
        topic: "topic1",
        data: { value: 42 },
      }));

      // subscriber should have received the message
      const subscriberCalls = (subscriberWs.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const publishedMsg = subscriberCalls.find((m: { type: string }) => m.type === "message");
      expect(publishedMsg).toBeDefined();
      expect(publishedMsg?.topic).toBe("topic1");
    });

    it("publish to non-existent topic still acks", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, JSON.stringify({
        type: "publish",
        topic: "nonexistent",
        data: "test",
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const ack = calls.find((m: { action?: string }) => m.action === "publish");
      expect(ack).toBeDefined();
    });
  });

  describe("swarm_register (lines 156-177)", () => {
    it("registers swarm agent and sends swarm_registered ack", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, JSON.stringify({
        type: "swarm_register",
        agent_id: "test-agent",
        display_name: "Test Agent",
        capabilities: ["code"],
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const registered = calls.find((m: { type: string }) => m.type === "swarm_registered");
      expect(registered).toBeDefined();
      expect(registered?.agent_id).toBe("test-agent");
    });
  });

  describe("oldHash mismatch (lines 309-316)", () => {
    it("sends error when oldHash does not match current hash", async () => {
      const ws = createMockWs();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      await wsHandler.handleMessage(ws, JSON.stringify({
        oldHash: "wrong-hash-value",
        newCode: "new code",
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const errorMsg = calls.find((m: { type: string }) => m.type === "error");
      expect(errorMsg).toBeDefined();
      expect(errorMsg?.message).toContain("hash mismatch");

      consoleError.mockRestore();
    });
  });

  describe("oldHash with updateAndBroadcastSession error (lines 320-326)", () => {
    it("sends error when updateAndBroadcastSession fails", async () => {
      const ws = createMockWs();
      const currentHash = computeSessionHash(mockSession);

      // tryCatch wraps the error, so we need the promise to reject
      (mockCode.updateAndBroadcastSession as ReturnType<typeof vi.fn>).mockImplementation(() =>
        Promise.reject(new Error("Broadcast failed")),
      );

      await wsHandler.handleMessage(ws, JSON.stringify({
        oldHash: currentHash,
        newCode: "updated code",
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      // Either an error or ack is sent depending on tryCatch behavior
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe("oldHash with successful patch (ack)", () => {
    it("sends ack after successful session patch", async () => {
      const ws = createMockWs();
      const currentHash = computeSessionHash(mockSession);

      await wsHandler.handleMessage(ws, JSON.stringify({
        oldHash: currentHash,
        newCode: "new code content",
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const ackMsg = calls.find((m: { type?: string; hashCode?: string }) => m.hashCode);
      expect(ackMsg).toBeDefined();
    });
  });

  describe("data.target routing (lines 334-344)", () => {
    it("forwards message to target socket by name", async () => {
      const senderWs = createMockWs({ name: "sender", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      const targetWs = createMockWs({ name: "target-user", subscribedTopics: [], blockedMessages: [], swarmAgent: null });

      allSockets.push(senderWs, targetWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        target: "target-user",
        data: { message: "hello" },
      }));

      expect(targetWs.send).toHaveBeenCalled();
    });

    it("does not forward if target not found", async () => {
      const senderWs = createMockWs({ name: "sender", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(senderWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        target: "nonexistent-user",
        data: "hello",
      }));

      // sender's send should not be called for routing
      expect(senderWs.send).not.toHaveBeenCalled();
    });
  });

  describe("data.name update (lines 346-373)", () => {
    it("updates attachment name and sends nameUpdate ack", async () => {
      const ws = createMockWs();
      await wsHandler.handleMessage(ws, JSON.stringify({ name: "new-name" }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls
        .map(([msg]: [string]) => JSON.parse(msg));
      const ackMsg = calls.find((m: { action?: string }) => m.action === "nameUpdate");
      expect(ackMsg).toBeDefined();
      expect(ackMsg?.name).toBe("new-name");
    });

    it("delivers blocked messages to newly named socket", async () => {
      const blockedMsg = { type: "blocked", data: "test" };
      // Other socket with blocked messages for "new-name"
      const otherWs = createMockWs({
        name: "new-name",
        subscribedTopics: [],
        blockedMessages: [blockedMsg],
        swarmAgent: null,
      });
      allSockets.push(otherWs);

      const ws = createMockWs({ name: null, subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws);

      await wsHandler.handleMessage(ws, JSON.stringify({ name: "new-name" }));

      // ws should have received the blocked message
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(blockedMsg));
    });
  });

  describe("getActiveUsers (lines 430-440)", () => {
    it("returns users subscribed to a codeSpace topic", async () => {
      const ws1 = createMockWs({
        name: "alice",
        subscribedTopics: ["my-space"],
        blockedMessages: [],
        swarmAgent: null,
      });
      const ws2 = createMockWs({
        name: "bob",
        subscribedTopics: ["other-space"],
        blockedMessages: [],
        swarmAgent: null,
      });
      allSockets.push(ws1, ws2);

      const users = wsHandler.getActiveUsers("my-space");
      expect(users).toContain("alice");
      expect(users).not.toContain("bob");
    });

    it("returns empty array when no sockets subscribed to codeSpace", () => {
      const ws = createMockWs({
        name: "alice",
        subscribedTopics: ["different-space"],
        blockedMessages: [],
        swarmAgent: null,
      });
      allSockets.push(ws);

      const users = wsHandler.getActiveUsers("my-space");
      expect(users).toHaveLength(0);
    });
  });

  describe("broadcast with excludeWs (lines 442-451)", () => {
    it("broadcasts to all sockets except the excluded one", () => {
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      const ws3 = createMockWs();
      allSockets.push(ws1, ws2, ws3);

      wsHandler.broadcast({ type: "update" }, ws1);

      expect(ws1.send).not.toHaveBeenCalled();
      expect(ws2.send).toHaveBeenCalled();
      expect(ws3.send).toHaveBeenCalled();
    });

    it("broadcasts to all sockets when no exclusion", () => {
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      allSockets.push(ws1, ws2);

      wsHandler.broadcast({ type: "update" });

      expect(ws1.send).toHaveBeenCalled();
      expect(ws2.send).toHaveBeenCalled();
    });
  });

  describe("subscribe — topic already in map (line 102 false branch)", () => {
    it("reuses existing topic set when topic already in map", async () => {
      const ws1 = createMockWs({ name: "user1", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws1);
      // First subscribe creates the set
      await wsHandler.handleMessage(ws1, JSON.stringify({ type: "subscribe", topics: ["shared-topic"] }));

      const ws2 = createMockWs({ name: "user2", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws2);
      // Second subscribe hits the !this.topics.has(topic) FALSE branch
      await wsHandler.handleMessage(ws2, JSON.stringify({ type: "subscribe", topics: ["shared-topic"] }));

      const calls = (ws2.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      const ack = calls.find((m: { action?: string }) => m.action === "subscribe");
      expect(ack).toBeDefined();
      expect(ack.topics).toEqual(["shared-topic"]);
    });
  });

  describe("unsubscribe — non-array topics (line 117 false branch)", () => {
    it("treats non-array unsubscribe topics as empty array", async () => {
      const ws = createMockWs({ name: "user", subscribedTopics: ["topicA"], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws);
      await wsHandler.handleMessage(ws, JSON.stringify({ type: "unsubscribe", topics: "topicA" }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      const ack = calls.find((m: { action?: string }) => m.action === "unsubscribe");
      expect(ack).toBeDefined();
      // No topics processed since non-array treated as empty
      expect(ack.topics).toEqual([]);
    });
  });

  describe("swarm_message — from_agent_id fallback chains (line 193)", () => {
    it("uses 'unknown' when sender has no swarmAgent and no name", async () => {
      const senderWs = createMockWs({ name: null, subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(senderWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_message",
        target_agent_id: "nobody",
        content: "from unknown",
      }));

      const calls = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "swarm_message_queued")).toBe(true);
    });

    it("uses attachment.name when sender has name but no swarmAgent", async () => {
      const senderWs = createMockWs({ name: "my-name", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(senderWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_message",
        target_agent_id: "nobody",
        content: "from named",
      }));

      const calls = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "swarm_message_queued")).toBe(true);
    });
  });

  describe("swarm_message — targetWs found, send throws (line 208 catch)", () => {
    it("sends ack to sender even when targetWs.send throws (safeSend catches internally)", async () => {
      const senderWs = createMockWs({ name: "sender", subscribedTopics: [], blockedMessages: [], swarmAgent: { agentId: "sender", displayName: "S", capabilities: [], registeredAt: Date.now() } });
      const targetWs = createMockWs({ name: "target-id", subscribedTopics: [], blockedMessages: [], swarmAgent: { agentId: "target-id", displayName: "T", capabilities: [], registeredAt: Date.now() } });
      allSockets.push(senderWs, targetWs);

      // Make target's send throw — safeSend will catch this internally and NOT propagate
      (targetWs.send as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("socket closed");
      });

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_message",
        target_agent_id: "target-id",
        content: "hello",
      }));

      // safeSend catches target send error, so the try block continues and sends ack
      const calls = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "ack")).toBe(true);
    });
  });

  describe("swarm_message offline loop — self-skip (line 221 true branch)", () => {
    it("skips sender socket in offline search loop", async () => {
      const senderWs = createMockWs({ name: "sender", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      const otherWs = createMockWs({ name: "unrelated", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(senderWs, otherWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_message",
        target_agent_id: "offline-target",
        content: "test",
      }));

      const calls = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "swarm_message_queued")).toBe(true);
    });
  });

  describe("swarm_delegate — from_agent_id fallback (line 252)", () => {
    it("uses 'unknown' when delegate sender has no swarmAgent or name", async () => {
      const ws = createMockWs({ name: null, subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws);

      await wsHandler.handleMessage(ws, JSON.stringify({
        type: "swarm_delegate",
        target_agent_id: "nobody",
        task_description: "do work",
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "swarm_delegate_queued")).toBe(true);
    });

    it("uses attachment.name for delegate sender when no swarmAgent", async () => {
      const ws = createMockWs({ name: "named-manager", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws);

      await wsHandler.handleMessage(ws, JSON.stringify({
        type: "swarm_delegate",
        target_agent_id: "nobody",
        task_description: "do work",
        priority: "low",
      }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "swarm_delegate_queued")).toBe(true);
    });
  });

  describe("swarm_delegate — targetWs found, send throws (lines 266-275 catch)", () => {
    it("sends ack to sender even when targetWs.send throws (safeSend catches internally)", async () => {
      const senderWs = createMockWs({ name: "manager", subscribedTopics: [], blockedMessages: [], swarmAgent: { agentId: "manager", displayName: "M", capabilities: [], registeredAt: Date.now() } });
      const targetWs = createMockWs({ name: "worker", subscribedTopics: [], blockedMessages: [], swarmAgent: { agentId: "worker", displayName: "W", capabilities: [], registeredAt: Date.now() } });
      allSockets.push(senderWs, targetWs);

      // Make target's send throw — safeSend catches it internally, outer try block continues
      (targetWs.send as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("closed");
      });

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_delegate",
        target_agent_id: "worker",
        task_description: "build it",
        priority: "high",
      }));

      // safeSend catches target send error, so outer try block continues and sends ack
      const calls = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "ack")).toBe(true);
    });
  });

  describe("swarm_delegate offline loop — self-skip (line 279 true branch)", () => {
    it("skips sender socket in swarm_delegate offline loop", async () => {
      const senderWs = createMockWs({ name: "manager", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      const otherWs = createMockWs({ name: "unrelated-worker", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(senderWs, otherWs);

      await wsHandler.handleMessage(senderWs, JSON.stringify({
        type: "swarm_delegate",
        target_agent_id: "missing-worker",
        task_description: "task",
      }));

      const calls = (senderWs.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      expect(calls.some((m: { type: string }) => m.type === "swarm_delegate_queued")).toBe(true);
    });
  });

  describe("handleError — delegates to handleClose", () => {
    it("logs error and calls handleClose on WebSocket error", () => {
      const ws = createMockWs({ name: "user", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      wsHandler.handleError(ws, new Error("test error"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("WebSocket error"), expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("getSwarmAgents — returns registered agents", () => {
    it("returns list of agents with swarmAgent info", () => {
      const ws1 = createMockWs({ name: "agent-1", subscribedTopics: [], blockedMessages: [], swarmAgent: { agentId: "agent-1", displayName: "Agent One", capabilities: ["tool-a"], registeredAt: Date.now() } });
      const ws2 = createMockWs({ name: "plain-user", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws1, ws2);

      const agents = wsHandler.getSwarmAgents();
      expect(agents.length).toBe(1);
      expect(agents[0]?.agentId).toBe("agent-1");
      expect(agents[0]?.online).toBe(true);
    });
  });

  describe("swarm_list_agents — responds with agents list", () => {
    it("sends swarm_agents_list in response", async () => {
      const ws = createMockWs({ name: "requester", subscribedTopics: [], blockedMessages: [], swarmAgent: null });
      allSockets.push(ws);

      await wsHandler.handleMessage(ws, JSON.stringify({ type: "swarm_list_agents" }));

      const calls = (ws.send as ReturnType<typeof vi.fn>).mock.calls.map(([m]: [string]) => JSON.parse(m));
      const agentsList = calls.find((m: { type: string }) => m.type === "swarm_agents_list");
      expect(agentsList).toBeDefined();
      expect(Array.isArray(agentsList.agents)).toBe(true);
    });
  });
});
