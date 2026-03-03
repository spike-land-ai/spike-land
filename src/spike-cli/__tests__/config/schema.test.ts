import { describe, expect, it } from "vitest";
import { validateConfig } from "../../config/schema.js";

describe("validateConfig", () => {
  it("validates a stdio server config", () => {
    const result = validateConfig({
      mcpServers: {
        vitest: {
          command: "yarn",
          args: ["vitest-mcp"],
        },
      },
    });
    expect(result.mcpServers.vitest).toEqual({
      command: "yarn",
      args: ["vitest-mcp"],
    });
  });

  it("validates a stdio server with explicit type", () => {
    const result = validateConfig({
      mcpServers: {
        test: {
          type: "stdio",
          command: "node",
          args: ["server.js"],
          env: { FOO: "bar" },
        },
      },
    });
    expect(result.mcpServers.test).toEqual({
      type: "stdio",
      command: "node",
      args: ["server.js"],
      env: { FOO: "bar" },
    });
  });

  it("validates an SSE server config", () => {
    const result = validateConfig({
      mcpServers: {
        remote: {
          type: "sse",
          url: "http://localhost:3000/api/mcp",
        },
      },
    });
    expect(result.mcpServers.remote).toEqual({
      type: "sse",
      url: "http://localhost:3000/api/mcp",
    });
  });

  it("validates a URL server config", () => {
    const result = validateConfig({
      mcpServers: {
        remote: {
          type: "url",
          url: "https://example.com/mcp",
        },
      },
    });
    expect(result.mcpServers.remote).toEqual({
      type: "url",
      url: "https://example.com/mcp",
    });
  });

  it("validates multiple servers", () => {
    const result = validateConfig({
      mcpServers: {
        a: { command: "node", args: ["a.js"] },
        b: { type: "url", url: "https://b.example.com/mcp" },
      },
    });
    expect(Object.keys(result.mcpServers)).toEqual(["a", "b"]);
  });

  it("rejects missing command in stdio config", () => {
    expect(() =>
      validateConfig({
        mcpServers: {
          bad: { args: ["test"] },
        },
      }),
    ).toThrow();
  });

  it("rejects invalid URL in http config", () => {
    expect(() =>
      validateConfig({
        mcpServers: {
          bad: { type: "url", url: "not-a-url" },
        },
      }),
    ).toThrow();
  });

  it("rejects missing mcpServers key", () => {
    expect(() => validateConfig({})).toThrow();
  });

  it("validates empty server list", () => {
    const result = validateConfig({ mcpServers: {} });
    expect(result.mcpServers).toEqual({});
  });
});
