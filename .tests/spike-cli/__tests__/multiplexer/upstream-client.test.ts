import { describe, expect, it } from "vitest";
import { UpstreamClient } from "../../../../src/spike-cli/multiplexer/upstream-client.js";

describe("UpstreamClient", () => {
  it("constructor sets name and defaults to disconnected", () => {
    const client = new UpstreamClient("my-server", { command: "node", args: ["server.js"] });
    expect(client.name).toBe("my-server");
    expect(client.connected).toBe(false);
  });

  it("connect() sets connected to true", async () => {
    const client = new UpstreamClient("srv", { command: "node" });
    await client.connect();
    expect(client.connected).toBe(true);
  });

  it("getTools() returns empty array by default", () => {
    const client = new UpstreamClient("srv", { command: "node" });
    expect(client.getTools()).toEqual([]);
  });

  it("callTool() throws Tool not found error", async () => {
    const client = new UpstreamClient("my-server", { command: "node" });
    await expect(client.callTool("missing", {})).rejects.toThrow(
      "Tool not found on upstream my-server: missing",
    );
  });

  it("close() sets connected to false", async () => {
    const client = new UpstreamClient("srv", { command: "node" });
    await client.connect();
    expect(client.connected).toBe(true);
    await client.close();
    expect(client.connected).toBe(false);
  });

  it("works with HTTP server config", async () => {
    const client = new UpstreamClient("http-srv", { type: "sse", url: "http://localhost:3000" });
    await client.connect();
    expect(client.connected).toBe(true);
    expect(client.getTools()).toEqual([]);
  });
});
