import { describe, expect, it } from "vitest";

import type {
  BrowserAdapter,
  BrowserPage,
  CdpAxNode,
} from "../../src/core/browser-automation/core-logic/adapter.js";
import { rebuildTree } from "../../src/core/browser-automation/core-logic/adapter.js";

describe("BrowserAdapter interface contract", () => {
  it("BrowserPage interface has all required methods", () => {
    // Type-level test: ensure a mock object satisfies the interface
    const page: BrowserPage = {
      goto: async () => undefined,
      title: async () => "Test",
      url: () => "https://test.com",
      screenshot: async () => "base64",
      evaluate: async () => undefined,
      setViewportSize: async () => {},
      close: async () => {},
      isClosed: () => false,
      keyboard: { press: async () => {}, type: async () => {} },
      getByRole: () => ({
        click: async () => {},
        fill: async () => {},
        clear: async () => {},
        selectOption: async () => [],
      }),
      mouse: { wheel: async () => {} },
      viewportSize: () => ({ width: 1280, height: 720 }),
      getAccessibilityTree: async () => null,
    };
    expect(page).toBeDefined();
    expect(typeof page.goto).toBe("function");
    expect(typeof page.getAccessibilityTree).toBe("function");
  });

  it("BrowserAdapter interface has all required methods", () => {
    const adapter: BrowserAdapter = {
      launch: async () => {},
      newPage: async () => ({}) as BrowserPage,
      isConnected: () => false,
      close: async () => {},
    };
    expect(adapter).toBeDefined();
    expect(typeof adapter.launch).toBe("function");
    expect(typeof adapter.newPage).toBe("function");
    expect(typeof adapter.isConnected).toBe("function");
    expect(typeof adapter.close).toBe("function");
  });
});

describe("rebuildTree", () => {
  it("returns null for empty nodes array", () => {
    const result = rebuildTree([]);
    expect(result).toBeNull();
  });

  it("builds single root node", () => {
    const nodes: CdpAxNode[] = [
      { nodeId: "1", role: { value: "RootWebArea" }, name: { value: "Test" } },
    ];
    const tree = rebuildTree(nodes);
    expect(tree).not.toBeNull();
    expect(tree?.role).toBe("RootWebArea");
    expect(tree?.name).toBe("Test");
  });

  it("links children via childIds", () => {
    const nodes: CdpAxNode[] = [
      { nodeId: "1", role: { value: "RootWebArea" }, childIds: ["2", "3"] },
      { nodeId: "2", role: { value: "main" }, name: { value: "Main" } },
      { nodeId: "3", role: { value: "banner" } },
    ];
    const tree = rebuildTree(nodes);
    expect(tree?.children).toHaveLength(2);
    expect(tree?.children?.[0]?.role).toBe("main");
    expect(tree?.children?.[1]?.role).toBe("banner");
  });

  it("defaults role to generic when missing", () => {
    const nodes: CdpAxNode[] = [{ nodeId: "1" }];
    const tree = rebuildTree(nodes);
    expect(tree?.role).toBe("generic");
  });

  it("maps CDP properties correctly", () => {
    const nodes: CdpAxNode[] = [
      {
        nodeId: "1",
        role: { value: "checkbox" },
        name: { value: "Accept" },
        value: { value: "on" },
        properties: [
          { name: "checked", value: { value: "true" } },
          { name: "disabled", value: { value: true } },
          { name: "expanded", value: { value: true } },
          { name: "selected", value: { value: true } },
          { name: "pressed", value: { value: "mixed" } },
          { name: "level", value: { value: 3 } },
        ],
      },
    ];
    const tree = rebuildTree(nodes);
    expect(tree?.checked).toBe(true);
    expect(tree?.disabled).toBe(true);
    expect(tree?.expanded).toBe(true);
    expect(tree?.selected).toBe(true);
    expect(tree?.pressed).toBe("mixed");
    expect(tree?.level).toBe(3);
    expect(tree?.value).toBe("on");
  });

  it("converts numeric value to string", () => {
    const nodes: CdpAxNode[] = [{ nodeId: "1", role: { value: "slider" }, value: { value: 42 } }];
    const tree = rebuildTree(nodes);
    expect(tree?.value).toBe("42");
  });

  it("skips unknown childIds", () => {
    const nodes: CdpAxNode[] = [
      { nodeId: "1", role: { value: "RootWebArea" }, childIds: ["2", "999"] },
      { nodeId: "2", role: { value: "main" } },
    ];
    const tree = rebuildTree(nodes);
    expect(tree?.children).toHaveLength(1);
  });
});
