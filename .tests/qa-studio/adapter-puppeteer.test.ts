import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock @cloudflare/puppeteer
const mockPageGoto = vi.fn().mockResolvedValue(null);
const mockPageTitle = vi.fn().mockResolvedValue("Test Page");
const mockPageUrl = vi.fn().mockReturnValue("https://example.com");
const mockPageClose = vi.fn().mockResolvedValue(undefined);
const mockPageIsClosed = vi.fn().mockReturnValue(false);
const mockPageScreenshot = vi.fn().mockResolvedValue("base64png");
const mockPageEvaluate = vi.fn().mockResolvedValue(undefined);
const mockPageSetViewport = vi.fn().mockResolvedValue(undefined);
const mockPageViewport = vi.fn().mockReturnValue({ width: 1280, height: 720 });
const mockKeyboardPress = vi.fn().mockResolvedValue(undefined);
const mockKeyboardType = vi.fn().mockResolvedValue(undefined);
const mockMouseWheel = vi.fn().mockResolvedValue(undefined);
const mockPageQuery = vi.fn();
const mockCdpSend = vi.fn().mockResolvedValue({ nodes: [] });
const mockCreateCDPSession = vi.fn().mockResolvedValue({ send: mockCdpSend });

function makeMockPuppeteerPage() {
  return {
    goto: mockPageGoto,
    title: mockPageTitle,
    url: mockPageUrl,
    close: mockPageClose,
    isClosed: mockPageIsClosed,
    screenshot: mockPageScreenshot,
    evaluate: mockPageEvaluate,
    setViewport: mockPageSetViewport,
    viewport: mockPageViewport,
    keyboard: { press: mockKeyboardPress, type: mockKeyboardType },
    mouse: { wheel: mockMouseWheel },
    $: mockPageQuery,
    $$: vi.fn().mockResolvedValue([]),
    createCDPSession: mockCreateCDPSession,
  };
}

const mockBrowserNewPage = vi.fn();
const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
const mockBrowserIsConnected = vi.fn().mockReturnValue(true);

vi.mock("@cloudflare/puppeteer", () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: mockBrowserNewPage,
      close: mockBrowserClose,
      isConnected: mockBrowserIsConnected,
    }),
  },
}));

import { PuppeteerAdapter } from "../../src/core/browser-automation/edge/adapter-puppeteer.js";

describe("PuppeteerAdapter", () => {
  const mockBinding = {} as Fetcher;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
    mockPageIsClosed.mockReturnValue(false);
  });

  it("creates adapter with browser binding", () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    expect(adapter).toBeDefined();
    expect(adapter.isConnected()).toBe(false);
  });

  it("launches browser and creates page", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    expect(page).toBeDefined();
    expect(adapter.isConnected()).toBe(true);
  });

  it("page.goto delegates to puppeteer page", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.goto("https://test.com", { waitUntil: "load" });
    expect(mockPageGoto).toHaveBeenCalledWith("https://test.com", { waitUntil: "load" });
  });

  it("page.title and url work", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    expect(await page.title()).toBe("Test Page");
    expect(page.url()).toBe("https://example.com");
  });

  it("page.screenshot returns base64", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    const result = await page.screenshot({ fullPage: false, encoding: "base64" });
    expect(result).toBe("base64png");
  });

  it("page.keyboard.press delegates correctly", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.keyboard.press("Enter");
    expect(mockKeyboardPress).toHaveBeenCalledWith("Enter");
  });

  it("page.mouse.wheel normalizes args to object", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.mouse.wheel(0, 720);
    expect(mockMouseWheel).toHaveBeenCalledWith({ deltaX: 0, deltaY: 720 });
  });

  it("page.viewportSize returns viewport dimensions", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  });

  it("page.getByRole.click uses aria selector", async () => {
    const mockEl = { click: vi.fn().mockResolvedValue(undefined) };
    mockPageQuery.mockResolvedValue(mockEl);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.getByRole("button", { name: "Submit" }).click();

    expect(mockPageQuery).toHaveBeenCalledWith('aria/Submit[role="button"]');
    expect(mockEl.click).toHaveBeenCalled();
  });

  it("page.getByRole.fill clears and types", async () => {
    const mockEl = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      type: vi.fn().mockResolvedValue(undefined),
    };
    mockPageQuery.mockResolvedValue(mockEl);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.getByRole("textbox", { name: "Email" }).fill("test@test.com");

    expect(mockPageQuery).toHaveBeenCalledWith('aria/Email[role="textbox"]');
    expect(mockEl.evaluate).toHaveBeenCalled();
    expect(mockEl.type).toHaveBeenCalledWith("test@test.com");
  });

  it("page.getByRole throws when element not found", async () => {
    mockPageQuery.mockResolvedValue(null);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await expect(page.getByRole("button", { name: "Missing" }).click()).rejects.toThrow(
      "No element found",
    );
  });

  it("page.getAccessibilityTree uses CDP", async () => {
    mockCdpSend.mockResolvedValue({
      nodes: [{ nodeId: "1", role: { value: "RootWebArea" }, name: { value: "Test" } }],
    });

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    const tree = await page.getAccessibilityTree();

    expect(tree).not.toBeNull();
    expect(tree?.role).toBe("RootWebArea");
    expect(mockCreateCDPSession).toHaveBeenCalled();
    expect(mockCdpSend).toHaveBeenCalledWith("Accessibility.getFullAXTree");
  });

  it("page.getAccessibilityTree returns null on CDP error", async () => {
    mockCdpSend.mockRejectedValue(new Error("CDP failed"));

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    const tree = await page.getAccessibilityTree();
    expect(tree).toBeNull();
  });

  it("adapter.close closes browser", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    await adapter.newPage();
    await adapter.close();
    expect(mockBrowserClose).toHaveBeenCalled();
  });
});
