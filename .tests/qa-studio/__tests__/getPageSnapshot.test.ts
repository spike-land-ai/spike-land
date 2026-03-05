import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Playwright mock setup ---
const mockPageOn = vi.fn();
const mockPageClose = vi.fn().mockResolvedValue(undefined);
const mockPageIsClosed = vi.fn().mockReturnValue(false);
const mockPageUrl = vi.fn().mockReturnValue("https://example.com");
const mockPageTitle = vi.fn().mockResolvedValue("Example");

const mockCdpSend = vi.fn();
const mockNewCDPSession = vi.fn().mockResolvedValue({ send: mockCdpSend });

function makeMockPage() {
  return {
    goto: vi.fn().mockResolvedValue(null),
    title: mockPageTitle,
    url: mockPageUrl,
    screenshot: vi.fn().mockResolvedValue("base64data"),
    evaluate: vi.fn().mockResolvedValue(undefined),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    close: mockPageClose,
    isClosed: mockPageIsClosed,
    locator: vi.fn().mockReturnValue({
      screenshot: vi.fn().mockResolvedValue("locator-base64"),
    }),
    on: mockPageOn,
    accessibility: { snapshot: vi.fn().mockResolvedValue(null) },
    keyboard: { press: vi.fn(), type: vi.fn() },
    getByRole: vi.fn().mockReturnValue({
      click: vi.fn(),
      fill: vi.fn(),
      clear: vi.fn(),
      selectOption: vi.fn(),
    }),
    mouse: { wheel: vi.fn() },
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    context: vi.fn().mockReturnValue({ newCDPSession: mockNewCDPSession }),
  };
}

const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
const mockBrowserIsConnected = vi.fn().mockReturnValue(true);
const mockBrowserNewPage = vi.fn();
const mockChromiumLaunch = vi.fn();

vi.mock("playwright", () => ({
  chromium: {
    launch: mockChromiumLaunch,
  },
}));

import {
  cleanup,
  getOrCreateTab,
  getPageSnapshot,
} from "../../../src/qa-studio/browser-session.js";

async function resetAll() {
  await cleanup();
  vi.clearAllMocks();

  mockPageIsClosed.mockReturnValue(false);
  mockPageUrl.mockReturnValue("https://example.com");
  mockPageTitle.mockResolvedValue("Example");
  mockPageClose.mockResolvedValue(undefined);
  mockBrowserClose.mockResolvedValue(undefined);
  mockBrowserIsConnected.mockReturnValue(true);
  mockBrowserNewPage.mockImplementation(() => Promise.resolve(makeMockPage()));
  mockChromiumLaunch.mockResolvedValue({
    newPage: mockBrowserNewPage,
    close: mockBrowserClose,
    isConnected: mockBrowserIsConnected,
  });
  mockCdpSend.mockResolvedValue({ nodes: [] });
  mockNewCDPSession.mockResolvedValue({ send: mockCdpSend });
}

beforeEach(async () => {
  await resetAll();
});

afterEach(async () => {
  await cleanup();
  vi.useRealTimers();
});

describe("getPageSnapshot", () => {
  it("returns null when no active tab exists", async () => {
    const result = await getPageSnapshot();
    expect(result).toBeNull();
  });

  it("returns snapshot with title and url from active tab", async () => {
    await getOrCreateTab();

    const result = await getPageSnapshot();
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Example");
    expect(result!.url).toBe("https://example.com");
    expect(result!.page).toBeDefined();
  });

  it("returns tree as null when CDP returns empty nodes", async () => {
    await getOrCreateTab();
    mockCdpSend.mockResolvedValue({ nodes: [] });

    const result = await getPageSnapshot();
    expect(result).not.toBeNull();
    expect(result!.tree).toBeNull();
  });

  it("returns tree when CDP returns a root node", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          role: { value: "RootWebArea" },
          name: { value: "Test Page" },
        },
      ],
    });

    const result = await getPageSnapshot();
    expect(result).not.toBeNull();
    expect(result!.tree).not.toBeNull();
    expect(result!.tree!.role).toBe("RootWebArea");
    expect(result!.tree!.name).toBe("Test Page");
  });

  it("builds tree with children linked by childIds", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          role: { value: "RootWebArea" },
          name: { value: "Root" },
          childIds: ["2", "3"],
        },
        {
          nodeId: "2",
          role: { value: "main" },
          name: { value: "Main" },
        },
        {
          nodeId: "3",
          role: { value: "banner" },
          name: { value: "Header" },
        },
      ],
    });

    const result = await getPageSnapshot();
    expect(result!.tree).not.toBeNull();
    expect(result!.tree!.children).toHaveLength(2);
    expect(result!.tree!.children![0]!.role).toBe("main");
    expect(result!.tree!.children![1]!.role).toBe("banner");
  });

  it("handles CDP node with no role (defaults to generic)", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          // No role property
        },
      ],
    });

    const result = await getPageSnapshot();
    expect(result!.tree).not.toBeNull();
    expect(result!.tree!.role).toBe("generic");
  });

  it("maps CDP node properties: checked, disabled, expanded, selected, pressed, level", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          role: { value: "checkbox" },
          name: { value: "Accept" },
          properties: [
            { name: "checked", value: { value: "true" } },
            { name: "disabled", value: { value: true } },
            { name: "expanded", value: { value: true } },
            { name: "selected", value: { value: true } },
            { name: "pressed", value: { value: "mixed" } },
            { name: "level", value: { value: 2 } },
          ],
        },
      ],
    });

    const result = await getPageSnapshot();
    const tree = result!.tree!;
    expect(tree.checked).toBe(true);
    expect(tree.disabled).toBe(true);
    expect(tree.expanded).toBe(true);
    expect(tree.selected).toBe(true);
    expect(tree.pressed).toBe("mixed");
    expect(tree.level).toBe(2);
  });

  it("maps CDP checked=false to boolean false", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          role: { value: "checkbox" },
          properties: [
            { name: "checked", value: { value: "false" } },
            { name: "pressed", value: { value: "false" } },
          ],
        },
      ],
    });

    const result = await getPageSnapshot();
    expect(result!.tree!.checked).toBe(false);
    expect(result!.tree!.pressed).toBe(false);
  });

  it("maps CDP value to string representation", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          role: { value: "textbox" },
          value: { value: 42 },
        },
      ],
    });

    const result = await getPageSnapshot();
    expect(result!.tree!.value).toBe("42");
  });

  it("returns tree as null when CDP returns no nodes array", async () => {
    await getOrCreateTab();
    mockCdpSend.mockResolvedValue({});

    const result = await getPageSnapshot();
    expect(result).not.toBeNull();
    expect(result!.tree).toBeNull();
  });

  it("handles CDP error gracefully and returns null tree", async () => {
    await getOrCreateTab();
    mockCdpSend.mockRejectedValue(new Error("CDP session failed"));

    const result = await getPageSnapshot();
    expect(result).not.toBeNull();
    expect(result!.tree).toBeNull();
  });

  it("skips unknown childIds during tree linking", async () => {
    await getOrCreateTab();

    mockCdpSend.mockResolvedValue({
      nodes: [
        {
          nodeId: "1",
          role: { value: "RootWebArea" },
          childIds: ["2", "999"], // 999 doesn't exist
        },
        {
          nodeId: "2",
          role: { value: "main" },
        },
      ],
    });

    const result = await getPageSnapshot();
    expect(result!.tree!.children).toHaveLength(1);
    expect(result!.tree!.children![0]!.role).toBe("main");
  });
});
