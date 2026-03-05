import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessibilityNode } from "../../src/qa-studio/types.js";

// ─── Mock browser-session (factory must not reference top-level vars) ────────

const mockGetOrCreateTab = vi.fn();
const mockGetActiveTab = vi.fn();
const mockGetPageSnapshot = vi.fn();
const mockListTabs = vi.fn();
const mockCloseTab = vi.fn();

vi.mock("../../src/qa-studio/browser-session.js", () => ({
  getOrCreateTab: (...args: unknown[]) => mockGetOrCreateTab(...args),
  getActiveTab: (...args: unknown[]) => mockGetActiveTab(...args),
  getPageSnapshot: (...args: unknown[]) => mockGetPageSnapshot(...args),
  listTabs: (...args: unknown[]) => mockListTabs(...args),
  closeTab: (...args: unknown[]) => mockCloseTab(...args),
  setBrowserConfig: vi.fn(),
  cleanup: vi.fn(),
}));

import { createMockServer } from "@spike-land-ai/mcp-server-base";
import { registerWebTools } from "../../src/qa-studio/tools.js";

// ─── Shared mock page ────────────────────────────────────────────────────────

const mockGoto = vi.fn().mockResolvedValue(null);
const mockTitle = vi.fn().mockResolvedValue("Test Page");
const mockUrl = vi.fn().mockReturnValue("https://example.com");
const mockScreenshot = vi.fn().mockResolvedValue("base64png");
const mockKeyboardPress = vi.fn().mockResolvedValue(undefined);
const mockClick = vi.fn().mockResolvedValue(undefined);
const mockFill = vi.fn().mockResolvedValue(undefined);
const mockClear = vi.fn().mockResolvedValue(undefined);
const mockSelectOption = vi.fn().mockResolvedValue(["opt1"]);
const mockMouseWheel = vi.fn().mockResolvedValue(undefined);
const mockViewportSize = vi.fn().mockReturnValue({ width: 1280, height: 720 });
const mockAccessibilitySnapshot = vi.fn();
const mockGetByRole = vi.fn().mockReturnValue({
  click: mockClick,
  fill: mockFill,
  clear: mockClear,
  selectOption: mockSelectOption,
});

const mockPage = {
  goto: mockGoto,
  title: mockTitle,
  url: mockUrl,
  screenshot: mockScreenshot,
  isClosed: vi.fn().mockReturnValue(false),
  close: vi.fn(),
  evaluate: vi.fn(),
  setViewportSize: vi.fn(),
  locator: vi.fn(),
  accessibility: { snapshot: mockAccessibilitySnapshot },
  keyboard: { press: mockKeyboardPress, type: vi.fn() },
  getByRole: mockGetByRole,
  mouse: { wheel: mockMouseWheel },
  viewportSize: mockViewportSize,
};

const simpleTree: AccessibilityNode = {
  role: "RootWebArea",
  name: "Test Page",
  children: [
    {
      role: "main",
      children: [
        { role: "heading", name: "Welcome", level: 1 },
        { role: "link", name: "Home" },
        { role: "button", name: "Submit" },
        { role: "textbox", name: "Email", value: "" },
      ],
    },
  ],
};

function setPageSnapshot(tree: AccessibilityNode | null) {
  mockGetPageSnapshot.mockResolvedValue(
    tree
      ? { tree, title: "Test Page", url: "https://example.com", page: mockPage }
      : null,
  );
}

describe("web tools", () => {
  const server = createMockServer();

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup mocks after clear
    mockGetOrCreateTab.mockResolvedValue({
      page: mockPage,
      entry: { consoleMessages: [], networkRequests: [] },
      index: 0,
    });
    mockGetActiveTab.mockReturnValue({
      page: mockPage,
      entry: { consoleMessages: [], networkRequests: [] },
      index: 0,
    });
    mockGetByRole.mockReturnValue({
      click: mockClick,
      fill: mockFill,
      clear: mockClear,
      selectOption: mockSelectOption,
    });
    setPageSnapshot(simpleTree);
    mockListTabs.mockResolvedValue([]);
    mockCloseTab.mockResolvedValue(true);
    mockAccessibilitySnapshot.mockResolvedValue(simpleTree);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Register tools once
  registerWebTools(server as never);

  describe("web_navigate", () => {
    it("navigates and returns narration", async () => {
      const result = await server.call("web_navigate", { url: "https://example.com" });
      expect(mockGoto).toHaveBeenCalledWith("https://example.com", { waitUntil: "load" });
      expect(result.content[0]!.text).toContain("Test Page");
      expect(result.content[0]!.text).toContain("heading level 1 ref=1");
    });

    it("uses custom wait_until", async () => {
      await server.call("web_navigate", {
        url: "https://example.com",
        wait_until: "networkidle",
      });
      expect(mockGoto).toHaveBeenCalledWith("https://example.com", { waitUntil: "networkidle" });
    });
  });

  describe("web_read", () => {
    it("returns full page narration", async () => {
      const result = await server.call("web_read", {});
      expect(result.content[0]!.text).toContain("main landmark");
      expect(result.content[0]!.text).toContain("heading level 1 ref=1");
    });

    it("filters by landmark", async () => {
      const result = await server.call("web_read", { landmark: "main" });
      expect(result.content[0]!.text).toContain("main landmark");
      // Inside main: heading ref=1, link ref=2, button ref=3, textbox ref=4
      expect(result.content[0]!.text).toContain("button ref=3");
    });

    it("returns message when no active tab", async () => {
      setPageSnapshot(null);
      const result = await server.call("web_read", {});
      expect(result.content[0]!.text).toContain("No active browser tab");
    });
  });

  describe("web_click", () => {
    it("clicks by ref", async () => {
      await server.call("web_click", { ref: 3 });
      expect(mockGetByRole).toHaveBeenCalledWith("button", { name: "Submit" });
      expect(mockClick).toHaveBeenCalled();
    });

    it("clicks by role and name", async () => {
      await server.call("web_click", { role: "button", name: "Submit" });
      expect(mockGetByRole).toHaveBeenCalledWith("button", { name: "Submit" });
      expect(mockClick).toHaveBeenCalled();
    });

    it("returns error when ref not found", async () => {
      const result = await server.call("web_click", { ref: 99 });
      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain("REF_NOT_FOUND");
    });

    it("returns error when no page", async () => {
      setPageSnapshot(null);
      const result = await server.call("web_click", { ref: 1 });
      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain("NO_PAGE");
    });

    it("returns error when no ref or role provided", async () => {
      const result = await server.call("web_click", {});
      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain("INVALID_INPUT");
    });
  });

  describe("web_type", () => {
    it("types into field by ref", async () => {
      await server.call("web_type", { ref: 4, text: "test@example.com" });
      expect(mockGetByRole).toHaveBeenCalledWith("textbox", { name: "Email" });
      expect(mockClear).toHaveBeenCalled();
      expect(mockFill).toHaveBeenCalledWith("test@example.com");
    });

    it("types without clearing when clear=false", async () => {
      await server.call("web_type", { ref: 4, text: "hello", clear: false });
      expect(mockClear).not.toHaveBeenCalled();
      expect(mockFill).toHaveBeenCalledWith("hello");
    });

    it("types by name", async () => {
      await server.call("web_type", { name: "Email", text: "hi" });
      expect(mockGetByRole).toHaveBeenCalledWith("textbox", { name: "Email" });
    });
  });

  describe("web_select", () => {
    it("selects option by ref", async () => {
      const treeWithCombo: AccessibilityNode = {
        role: "RootWebArea",
        children: [
          { role: "combobox", name: "Country", value: "US" },
        ],
      };
      setPageSnapshot(treeWithCombo);
      await server.call("web_select", { ref: 1, option: "UK" });
      expect(mockSelectOption).toHaveBeenCalledWith("UK");
    });
  });

  describe("web_press", () => {
    it("presses a key", async () => {
      await server.call("web_press", { key: "Enter" });
      expect(mockKeyboardPress).toHaveBeenCalledWith("Enter");
    });

    it("returns error when no page", async () => {
      mockGetActiveTab.mockReturnValue(null);
      const result = await server.call("web_press", { key: "Tab" });
      expect(result.isError).toBe(true);
    });
  });

  describe("web_scroll", () => {
    it("scrolls down by default", async () => {
      await server.call("web_scroll", {});
      expect(mockMouseWheel).toHaveBeenCalledWith(0, 720);
    });

    it("scrolls up", async () => {
      await server.call("web_scroll", { direction: "up" });
      expect(mockMouseWheel).toHaveBeenCalledWith(0, -720);
    });

    it("scrolls by custom amount", async () => {
      await server.call("web_scroll", { direction: "down", amount: 2 });
      expect(mockMouseWheel).toHaveBeenCalledWith(0, 1440);
    });
  });

  describe("web_tabs", () => {
    it("lists tabs", async () => {
      mockListTabs.mockResolvedValue([
        { index: 0, url: "https://a.com", title: "Page A" },
        { index: 1, url: "https://b.com", title: "Page B" },
      ]);
      const result = await server.call("web_tabs", { action: "list" });
      expect(result.content[0]!.text).toContain("Page A");
      expect(result.content[0]!.text).toContain("Page B");
    });

    it("returns message when no tabs", async () => {
      const result = await server.call("web_tabs", { action: "list" });
      expect(result.content[0]!.text).toContain("No open tabs");
    });

    it("switches tab", async () => {
      await server.call("web_tabs", { action: "switch", tab: 1 });
      expect(mockGetOrCreateTab).toHaveBeenCalledWith(1);
    });

    it("closes tab", async () => {
      const result = await server.call("web_tabs", { action: "close", tab: 0 });
      expect(mockCloseTab).toHaveBeenCalledWith(0);
      expect(result.content[0]!.text).toContain("closed");
    });

    it("returns error when switch without tab index", async () => {
      const result = await server.call("web_tabs", { action: "switch" });
      expect(result.isError).toBe(true);
    });

    it("returns error for unknown action", async () => {
      const result = await server.call("web_tabs", { action: "unknown_action" as "list" });
      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain("INVALID_INPUT");
    });
  });

  describe("web_screenshot", () => {
    it("returns screenshot", async () => {
      const result = await server.call("web_screenshot", {});
      expect(mockScreenshot).toHaveBeenCalledWith({
        fullPage: false,
        encoding: "base64",
        type: "png",
      });
      expect(result.content[0]).toMatchObject({
        type: "image",
        mimeType: "image/png",
      });
    });

    it("returns error when no page", async () => {
      mockGetActiveTab.mockReturnValue(null);
      const result = await server.call("web_screenshot", {});
      expect(result.isError).toBe(true);
    });
  });

  describe("web_forms", () => {
    it("lists form fields", async () => {
      const result = await server.call("web_forms", {});
      expect(result.content[0]!.text).toContain("textbox");
      expect(result.content[0]!.text).toContain("Email");
    });

    it("returns message when no fields", async () => {
      const emptyTree: AccessibilityNode = {
        role: "RootWebArea",
        children: [{ role: "text", name: "No forms here" }],
      };
      setPageSnapshot(emptyTree);
      const result = await server.call("web_forms", {});
      expect(result.content[0]!.text).toContain("No form fields");
    });

    it("returns error when no page", async () => {
      setPageSnapshot(null);
      const result = await server.call("web_forms", {});
      expect(result.isError).toBe(true);
    });
  });
});
