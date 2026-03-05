import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPageOn = vi.fn();
const mockPageClose = vi.fn().mockResolvedValue(undefined);
const mockPageIsClosed = vi.fn().mockReturnValue(false);
const mockPageUrl = vi.fn().mockReturnValue("about:blank");
const mockPageTitle = vi.fn().mockResolvedValue("Blank");

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
    locator: vi.fn().mockReturnValue({ screenshot: vi.fn().mockResolvedValue("") }),
    on: mockPageOn,
    accessibility: { snapshot: vi.fn().mockResolvedValue(null) },
    keyboard: { press: vi.fn(), type: vi.fn() },
    getByRole: vi.fn().mockReturnValue({ click: vi.fn(), fill: vi.fn(), clear: vi.fn(), selectOption: vi.fn() }),
    mouse: { wheel: vi.fn() },
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    context: vi.fn().mockReturnValue({ newCDPSession: vi.fn().mockResolvedValue({ send: vi.fn().mockResolvedValue({}) }) }),
  };
}

const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
const mockBrowserIsConnected = vi.fn().mockReturnValue(true);
const mockBrowserNewPage = vi.fn();
const mockChromiumLaunch = vi.fn();

vi.mock("playwright", () => ({
  chromium: { launch: mockChromiumLaunch },
}));

import { setBrowserConfig, getOrCreateTab, cleanup } from "../../../src/qa-studio/browser-session.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockPageIsClosed.mockReturnValue(false);
  mockBrowserIsConnected.mockReturnValue(true);
  mockBrowserNewPage.mockImplementation(() => Promise.resolve(makeMockPage()));
  mockChromiumLaunch.mockResolvedValue({
    newPage: mockBrowserNewPage,
    close: mockBrowserClose,
    isConnected: mockBrowserIsConnected,
  });
});

afterEach(async () => {
  await cleanup();
  // Always reset to default so module state is clean for next test
  setBrowserConfig({ headless: true });
  vi.clearAllMocks();
});

describe("setBrowserConfig", () => {
  it("applies headless:false and slowMo to browser launch", async () => {
    setBrowserConfig({ headless: false, slowMo: 100 });

    await getOrCreateTab();

    expect(mockChromiumLaunch).toHaveBeenCalledWith({ headless: false, slowMo: 100 });
  });

  it("merges partial config with existing config", async () => {
    // Set slowMo only — headless should remain from default (true)
    setBrowserConfig({ headless: true });
    setBrowserConfig({ slowMo: 50 });

    await getOrCreateTab();

    expect(mockChromiumLaunch).toHaveBeenCalledWith({ headless: true, slowMo: 50 });
  });
});
