import { describe, expect, it } from "vitest";
import {
  isHttpConfig,
  isStdioConfig,
} from "../../../../src/spike-cli/config/types.js";
import type { ServerConfig } from "../../../../src/spike-cli/config/types.js";

describe("isStdioConfig", () => {
  it("returns true for config with type undefined", () => {
    const config: ServerConfig = { command: "node", args: ["server.js"] };
    expect(isStdioConfig(config)).toBe(true);
  });

  it("returns true for config with type 'stdio'", () => {
    const config: ServerConfig = { type: "stdio", command: "node" };
    expect(isStdioConfig(config)).toBe(true);
  });

  it("returns false for HTTP config", () => {
    const config: ServerConfig = { type: "sse", url: "http://localhost:3000" };
    expect(isStdioConfig(config)).toBe(false);
  });

  it("returns false for url type", () => {
    const config: ServerConfig = { type: "url", url: "http://example.com" };
    expect(isStdioConfig(config)).toBe(false);
  });
});

describe("isHttpConfig", () => {
  it("returns true for config with type 'sse'", () => {
    const config: ServerConfig = { type: "sse", url: "http://localhost:3000" };
    expect(isHttpConfig(config)).toBe(true);
  });

  it("returns true for config with type 'url'", () => {
    const config: ServerConfig = { type: "url", url: "http://example.com" };
    expect(isHttpConfig(config)).toBe(true);
  });

  it("returns false for stdio config", () => {
    const config: ServerConfig = { command: "node", args: ["server.js"] };
    expect(isHttpConfig(config)).toBe(false);
  });

  it("returns false for type 'stdio'", () => {
    const config: ServerConfig = { type: "stdio", command: "node" };
    expect(isHttpConfig(config)).toBe(false);
  });
});
