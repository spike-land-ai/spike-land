import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the PuppeteerAdapter module
const mockLaunch = vi.fn().mockResolvedValue(undefined);
const mockNewPage = vi.fn();
const mockIsConnected = vi.fn().mockReturnValue(true);
const mockAdapterClose = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/core/browser-automation/adapter-puppeteer.js", () => {
  return {
    PuppeteerAdapter: class MockPuppeteerAdapter {
      launch() {
        return mockLaunch();
      }
      newPage() {
        return mockNewPage();
      }
      isConnected() {
        return mockIsConnected();
      }
      close() {
        return mockAdapterClose();
      }
    },
  };
});

// Mock cloudflare:workers
vi.mock("cloudflare:workers", () => {
  class FakeDurableObject {
    env;
    ctx;
    constructor(ctx, env) {
      this.env = env;
      this.ctx = ctx;
    }
  }
  return { DurableObject: FakeDurableObject };
});

function makeMockPage() {
  return {
    goto: vi.fn().mockResolvedValue(null),
    title: vi.fn().mockResolvedValue("Test Page"),
    url: vi.fn().mockReturnValue("https://example.com"),
    screenshot: vi.fn().mockResolvedValue("base64data"),
    evaluate: vi.fn().mockResolvedValue(undefined),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isClosed: vi.fn().mockReturnValue(false),
    keyboard: {
      press: vi.fn().mockResolvedValue(undefined),
      type: vi.fn().mockResolvedValue(undefined),
    },
    getByRole: vi.fn().mockReturnValue({
      click: vi.fn().mockResolvedValue(undefined),
      fill: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      selectOption: vi.fn().mockResolvedValue([]),
    }),
    mouse: { wheel: vi.fn().mockResolvedValue(undefined) },
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    getAccessibilityTree: vi.fn().mockResolvedValue({
      role: "RootWebArea",
      name: "Test Page",
      children: [
        {
          role: "main",
          children: [
            { role: "heading", name: "Welcome", level: 1 },
            { role: "button", name: "Submit" },
          ],
        },
      ],
    }),
  };
}

import { BrowserSessionDO } from "../../src/core/browser-automation/edge/session-do.js";

describe("BrowserSessionDO", () => {
  let dObj: BrowserSessionDO;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNewPage.mockResolvedValue(makeMockPage());

    const mockCtx = {
      storage: { setAlarm: vi.fn().mockResolvedValue(undefined) },
      id: { toString: () => "test-id" },
    };
    const mockEnv = { BROWSER: {} as Fetcher, BROWSER_SESSION: {} };

    dObj = new BrowserSessionDO(mockCtx as never, mockEnv as never);
  });

  it("navigate launches browser and returns narration", async () => {
    const result = await dObj.navigate("https://example.com");
    expect(mockLaunch).toHaveBeenCalled();
    expect(mockNewPage).toHaveBeenCalled();
    expect(result).toContain("Test Page");
  });

  it("readPage returns narration text", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.readPage("compact");
    expect(result).toContain("Test Page");
    expect(result).toContain("ref=");
  });

  it("readPage with full detail returns verbose narration", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.readPage("full");
    expect(result).toContain("heading level 1");
  });

  it("readPage returns error when no tab", async () => {
    const result = await dObj.readPage();
    expect(result).toContain("No active browser tab");
  });

  it("press delegates to keyboard", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.press("Enter");
    expect(result).toBeDefined();
  });

  it("scroll delegates to mouse wheel", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.scroll("down", 1);
    expect(result).toBeDefined();
  });

  it("screenshot returns base64 string", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.screenshot();
    expect(result).toBe("base64data");
  });

  it("screenshot returns empty string when no tab", async () => {
    const result = await dObj.screenshot();
    expect(result).toBe("");
  });

  it("listTabs returns tab list", async () => {
    await dObj.navigate("https://example.com");
    const tabs = await dObj.listTabs();
    expect(tabs).toHaveLength(1);
    expect(tabs[0]?.url).toBe("https://example.com");
  });

  it("closeTab closes and removes tab", async () => {
    await dObj.navigate("https://example.com");
    const closed = await dObj.closeTab(0);
    expect(closed).toBe(true);
    const tabs = await dObj.listTabs();
    expect(tabs).toHaveLength(0);
  });

  it("closeTab returns false for non-existent tab", async () => {
    const closed = await dObj.closeTab(99);
    expect(closed).toBe(false);
  });

  it("alarm triggers cleanup", async () => {
    await dObj.navigate("https://example.com");
    await dObj.alarm();
    expect(mockAdapterClose).toHaveBeenCalled();
  });
});
