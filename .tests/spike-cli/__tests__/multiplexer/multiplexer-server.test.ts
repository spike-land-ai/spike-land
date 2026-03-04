import { beforeEach, describe, expect, it, vi } from "vitest";
import { MultiplexerServer } from "../../../../src/spike-cli/multiplexer/multiplexer-server.js";
import type { NamespacedTool, ServerManager } from "../../../../src/spike-cli/multiplexer/server-manager.js";

// Mock the MCP SDK Server and transport using class syntax
const mockConnect = vi.hoisted(() => vi.fn());
const mockClose = vi.hoisted(() => vi.fn());
const mockSetRequestHandler = vi.hoisted(() => vi.fn());

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: class MockServer {
    connect = mockConnect;
    close = mockClose;
    setRequestHandler = mockSetRequestHandler;
    constructor() {}
  },
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: class MockTransport {
    constructor() {}
  },
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  ListToolsRequestSchema: Symbol("ListToolsRequestSchema"),
  CallToolRequestSchema: Symbol("CallToolRequestSchema"),
}));

describe("MultiplexerServer", () => {
  let mockManager: ServerManager;

  const sampleTools: NamespacedTool[] = [
    {
      namespacedName: "vitest__run_tests",
      originalName: "run_tests",
      serverName: "vitest",
      description: "Run vitest tests",
      inputSchema: {
        type: "object",
        properties: { filter: { type: "string" } },
      },
    },
    {
      namespacedName: "playwright__navigate",
      originalName: "navigate",
      serverName: "playwright",
      description: "Navigate browser",
      inputSchema: { type: "object", properties: { url: { type: "string" } } },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockManager = {
      getAllTools: vi.fn().mockReturnValue(sampleTools),
      callTool: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "result" }],
      }),
    } as unknown as ServerManager;
  });

  it("creates server and registers handlers", () => {
    new MultiplexerServer(mockManager);
    // Should register ListToolsRequestSchema and CallToolRequestSchema handlers
    expect(mockSetRequestHandler).toHaveBeenCalledTimes(2);
  });

  it("serves via StdioServerTransport", async () => {
    const mux = new MultiplexerServer(mockManager);
    await mux.serve();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("closes the server", async () => {
    const mux = new MultiplexerServer(mockManager);
    await mux.close();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("list tools handler returns aggregated tools", async () => {
    new MultiplexerServer(mockManager);

    // Get the ListToolsRequestSchema handler (first call)
    const listToolsHandler = mockSetRequestHandler.mock.calls[0][1] as () => Promise<unknown>;
    const result = await listToolsHandler();

    expect(result).toEqual({
      tools: [
        {
          name: "vitest__run_tests",
          description: "[vitest] Run vitest tests",
          inputSchema: {
            type: "object",
            properties: { filter: { type: "string" } },
          },
        },
        {
          name: "playwright__navigate",
          description: "[playwright] Navigate browser",
          inputSchema: {
            type: "object",
            properties: { url: { type: "string" } },
          },
        },
      ],
    });
  });

  it("call tool handler routes to correct upstream", async () => {
    new MultiplexerServer(mockManager);

    // Get the CallToolRequestSchema handler (second call)
    const callToolHandler = mockSetRequestHandler.mock.calls[1][1] as (
      req: unknown,
    ) => Promise<unknown>;

    const result = await callToolHandler({
      params: { name: "vitest__run_tests", arguments: { filter: "*.test.ts" } },
    });

    expect(mockManager.callTool).toHaveBeenCalledWith("vitest__run_tests", {
      filter: "*.test.ts",
    });
    expect(result).toEqual({
      content: [{ type: "text", text: "result" }],
    });
  });

  it("call tool handler returns error on failure", async () => {
    (mockManager.callTool as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("upstream down"),
    );
    new MultiplexerServer(mockManager);

    const callToolHandler = mockSetRequestHandler.mock.calls[1][1] as (
      req: unknown,
    ) => Promise<unknown>;

    const result = await callToolHandler({
      params: { name: "bad__tool", arguments: {} },
    });

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: upstream down" }],
      isError: true,
    });
  });

  it("list tools handler uses empty string when description is undefined (line 30 ?? branch)", async () => {
    (mockManager.getAllTools as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        namespacedName: "vitest__no_desc",
        originalName: "no_desc",
        serverName: "vitest",
        description: undefined,
        inputSchema: { type: "object", properties: {} },
      },
    ]);
    new MultiplexerServer(mockManager);

    const listToolsHandler = mockSetRequestHandler.mock.calls[0][1] as () => Promise<unknown>;
    const result = await listToolsHandler() as { tools: Array<{ description: string }> };

    expect(result.tools[0].description).toBe("[vitest] ");
  });

  it("call tool handler uses empty object when args is undefined (line 39 ?? branch)", async () => {
    new MultiplexerServer(mockManager);

    const callToolHandler = mockSetRequestHandler.mock.calls[1][1] as (
      req: unknown,
    ) => Promise<unknown>;

    // No arguments field in params — triggers args ?? {} fallback
    await callToolHandler({
      params: { name: "vitest__run_tests" }, // no arguments property
    });

    expect(mockManager.callTool).toHaveBeenCalledWith("vitest__run_tests", {});
  });
});
