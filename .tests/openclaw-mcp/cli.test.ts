import { describe, expect, it, vi, beforeEach } from "vitest";
import { execFile } from "node:child_process";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const mockBridgeInstance = {
  loadGatewayTools: vi.fn().mockResolvedValue(undefined),
  serve: vi.fn().mockResolvedValue(undefined),
  listTools: vi.fn().mockReturnValue([]),
  callTool: vi.fn().mockResolvedValue({ content: [] }),
};

vi.mock("../../src/openclaw-mcp/bridge.js", () => ({
  createMcpBridge: vi.fn(() => mockBridgeInstance),
}));

import { CliTransport, main } from "../../src/openclaw-mcp/cli.js";
import { createMcpBridge } from "../../src/openclaw-mcp/bridge.js";

beforeEach(() => {
  vi.mocked(createMcpBridge).mockClear();
  mockBridgeInstance.loadGatewayTools.mockClear();
  mockBridgeInstance.serve.mockClear();
});

describe("CliTransport", () => {
  it("should return empty tools list", async () => {
    const transport = new CliTransport();
    const result = await transport.request("tools.list");
    expect(result).toEqual({ tools: [], sessionKey: "cli" });
  });

  it("should throw for unsupported method", async () => {
    const transport = new CliTransport();
    await expect(transport.request("invalid")).rejects.toThrow("Unsupported method");
  });

  it("should throw if message is missing in chat.send", async () => {
    const transport = new CliTransport();
    await expect(transport.request("chat.send", {})).rejects.toThrow("message is required");
  });

  it("should throw if params is null in chat.send", async () => {
    const transport = new CliTransport();
    await expect(transport.request("chat.send", null)).rejects.toThrow("message is required");
  });

  it("should send chat message via CLI", async () => {
    const transport = new CliTransport("custom-bin");
    const mockOutput = {
      result: { payloads: [{ text: "hello from cli" }] },
    };

    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      (cb as Parameters<typeof execFile>[3])(null, JSON.stringify(mockOutput), "");
      return {} as ReturnType<typeof execFile>;
    });

    const result = (await transport.request("chat.send", {
      message: "hi",
      sessionKey: "sess1",
    })) as { message: { content: Array<{ type: string; text: string }> } };
    expect(result.message.content[0]?.text).toBe("hello from cli");
    expect(execFile).toHaveBeenCalledWith(
      "custom-bin",
      expect.arrayContaining(["--message", "hi", "--session-id", "sess1"]),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("should handle CLI error response", async () => {
    const transport = new CliTransport();
    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      (cb as Parameters<typeof execFile>[3])(null, JSON.stringify({ error: "CLI Crashed" }), "");
      return {} as ReturnType<typeof execFile>;
    });

    await expect(transport.request("chat.send", { message: "hi" })).rejects.toThrow(
      "OpenClaw: CLI Crashed",
    );
  });

  it("should handle execFile error", async () => {
    const transport = new CliTransport();
    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      (cb as Parameters<typeof execFile>[3])(new Error("Spawn error"), "", "some stderr");
      return {} as ReturnType<typeof execFile>;
    });

    await expect(transport.request("chat.send", { message: "hi" })).rejects.toThrow("Spawn error");
  });

  it("should handle null stdout/stderr from execFile", async () => {
    const transport = new CliTransport();
    const mockOutput = { result: { payloads: [{ text: "ok" }] } };

    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      // Pass null for stdout/stderr to exercise the ?? "" fallback
      (cb as Parameters<typeof execFile>[3])(null, null as unknown as string, null as unknown as string);
      return {} as ReturnType<typeof execFile>;
    });

    // stdout is null → JSON.parse("") will throw, so mock valid JSON
    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      (cb as Parameters<typeof execFile>[3])(null, JSON.stringify(mockOutput), null as unknown as string);
      return {} as ReturnType<typeof execFile>;
    });

    const result = (await transport.request("chat.send", { message: "hi" })) as {
      message: { content: Array<{ type: string; text: string }> };
    };
    expect(result.message.content[0]?.text).toBe("ok");
  });

  it("should handle empty payloads response", async () => {
    const transport = new CliTransport();
    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      (cb as Parameters<typeof execFile>[3])(
        null,
        JSON.stringify({ result: { payloads: [] } }),
        "",
      );
      return {} as ReturnType<typeof execFile>;
    });

    const result = (await transport.request("chat.send", { message: "hi" })) as {
      message: { content: Array<{ type: string; text: string }> };
    };
    expect(result.message.content[0]?.text).toBe("(no response)");
  });

  it("should reject when stdout is null (JSON.parse of empty string throws)", async () => {
    const transport = new CliTransport();
    vi.mocked(execFile).mockImplementation((_bin, _args, _opts, cb) => {
      // Pass null for stdout → stdout ?? "" → "" → JSON.parse("") throws SyntaxError
      (cb as Parameters<typeof execFile>[3])(null, null as unknown as string, "");
      return {} as ReturnType<typeof execFile>;
    });

    await expect(transport.request("chat.send", { message: "hi" })).rejects.toThrow(
      SyntaxError,
    );
  });
});

describe("main", () => {
  it("creates CliTransport and runs the bridge", async () => {
    await main();
    expect(createMcpBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        serverInfo: { name: "openclaw-mcp", version: "0.1.0" },
        verbose: true,
      }),
    );
    expect(mockBridgeInstance.loadGatewayTools).toHaveBeenCalled();
    expect(mockBridgeInstance.serve).toHaveBeenCalled();
  });
});
