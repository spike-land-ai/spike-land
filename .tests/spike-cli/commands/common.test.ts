import { describe, expect, it } from "vitest";
import { collect, parseInlineServers, parseInlineUrls } from "../../../src/spike-cli/commands/common";

describe("common command helpers", () => {
  it("collect appends to array", () => {
    expect(collect("a", [])).toEqual(["a"]);
    expect(collect("b", ["a"])).toEqual(["a", "b"]);
  });

  it("parseInlineServers parses name=command", () => {
    expect(parseInlineServers(["s1=cmd1"])).toEqual([
      {
        name: "s1",
        command: "cmd1",
      },
    ]);
  });

  it("parseInlineServers throws on invalid format", () => {
    expect(() => parseInlineServers(["invalid"])).toThrow("Invalid --server format");
    expect(() => parseInlineServers(["=cmd"])).toThrow("Server name must not be empty");
    expect(() => parseInlineServers(["s1="])).toThrow("Server command must not be empty");
  });

  it("parseInlineUrls parses name=url", () => {
    expect(parseInlineUrls(["s1=http://localhost:8080"])).toEqual([
      { name: "s1", url: "http://localhost:8080" },
    ]);
  });

  it("parseInlineUrls validates ports", () => {
    expect(() => parseInlineUrls(["s1=http://localhost:99999"])).toThrow("Port must be 1–65535");
  });

  it("parseInlineUrls throws when no = separator", () => {
    expect(() => parseInlineUrls(["noequalssign"])).toThrow("Invalid --server-url format");
    expect(() => parseInlineUrls(["noequalssign"])).toThrow("Use name=url");
  });

  it("parseInlineUrls throws when name is empty", () => {
    expect(() => parseInlineUrls(["=http://localhost:3000"])).toThrow("Server name must not be empty");
  });

  it("parseInlineUrls throws when url is empty", () => {
    expect(() => parseInlineUrls(["myserver="])).toThrow("URL must not be empty");
  });

  it("parseInlineUrls throws for invalid URL containing invalid port via catch path", () => {
    // URL with invalid IPv6 that throws 'Invalid URL' but has port > 65535
    expect(() =>
      parseInlineUrls(["s1=http://[::invalid]:99999"]),
    ).toThrow("Port must be 1–65535");
  });

  it("parseInlineUrls allows valid port range", () => {
    expect(parseInlineUrls(["s1=http://localhost:1"])).toEqual([
      { name: "s1", url: "http://localhost:1" },
    ]);
    expect(parseInlineUrls(["s1=http://localhost:65535"])).toEqual([
      { name: "s1", url: "http://localhost:65535" },
    ]);
  });

  it("parseInlineUrls throws for port 0 (line 62 throw, line 68 rethrow)", () => {
    // new URL("http://localhost:0") succeeds; parseInt("0") = 0 < 1 → throws at line 62.
    // The catch block re-throws at line 68 because err.message includes "Port must be".
    expect(() => parseInlineUrls(["s=http://localhost:0"])).toThrow("Port must be 1–65535");
  });

  it("parseInlineUrls throws for invalid URL with port-like suffix via fallback path (lines 72-76)", () => {
    // "http://bad host:99999" throws "Invalid URL" from new URL(), then the fallback
    // path (lines 72-76) extracts port from the last ':' segment and throws.
    expect(() => parseInlineUrls(["s=http://bad host:99999"])).toThrow("Port must be 1–65535");
  });
});
