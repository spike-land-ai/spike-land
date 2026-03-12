/**
 * Browser Session Manager
 *
 * Thin facade over a BrowserAdapter. Manages tabs, idle timeout, and
 * accessibility snapshots. Defaults to PlaywrightAdapter for Node.js CLI.
 */

import type { AccessibilityNode, BrowserConfig } from "./types.js";
import type { BrowserAdapter, BrowserPage } from "./adapter.js";
import { PlaywrightAdapter, setupPageListeners } from "../testing/adapter-playwright.js";
import type { TabEntry } from "../testing/adapter-playwright.js";

export type { TabEntry };

export interface BrowserTab {
  index: number;
  url: string;
  title: string;
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

let adapter: BrowserAdapter & { setConfig?: (c: Partial<BrowserConfig>) => void } =
  new PlaywrightAdapter();
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const tabs = new Map<number, TabEntry>();
let activeTabIndex = 0;
let nextTabIndex = 0;

/**
 * Replace the default adapter (for Workers/Puppeteer mode).
 */
export function setAdapter(newAdapter: BrowserAdapter): void {
  adapter = newAdapter;
}

/**
 * Override browser launch options before first call.
 */
export function setBrowserConfig(config: BrowserConfig): void {
  if (adapter.setConfig) {
    adapter.setConfig(config);
  }
}

function resetIdleTimer(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    void cleanup();
  }, IDLE_TIMEOUT_MS);
}

async function ensureBrowser(): Promise<BrowserAdapter> {
  if (adapter.isConnected()) {
    resetIdleTimer();
    return adapter;
  }
  await adapter.launch();
  resetIdleTimer();
  return adapter;
}

export async function getOrCreateTab(index?: number): Promise<{
  page: BrowserPage;
  entry: TabEntry;
  index: number;
}> {
  await ensureBrowser();

  if (index !== undefined && tabs.has(index)) {
    activeTabIndex = index;
    const entry = tabs.get(index);
    return { page: entry.page, entry, index };
  }

  const page = await adapter.newPage();
  const tabIndex = nextTabIndex++;
  const entry: TabEntry = {
    page,
    consoleMessages: [],
    networkRequests: [],
  };
  setupPageListeners(page, entry);
  tabs.set(tabIndex, entry);
  activeTabIndex = tabIndex;
  return { page, entry, index: tabIndex };
}

export function getActiveTab(): {
  page: BrowserPage;
  entry: TabEntry;
  index: number;
} | null {
  const entry = tabs.get(activeTabIndex);
  if (!entry || entry.page.isClosed()) return null;
  resetIdleTimer();
  return { page: entry.page, entry, index: activeTabIndex };
}

export async function listTabs(): Promise<BrowserTab[]> {
  const result: BrowserTab[] = [];
  for (const [index, entry] of tabs) {
    if (entry.page.isClosed()) {
      tabs.delete(index);
      continue;
    }
    result.push({
      index,
      url: entry.page.url(),
      title: await entry.page.title(),
    });
  }
  return result;
}

export async function closeTab(index: number): Promise<boolean> {
  const entry = tabs.get(index);
  if (!entry) return false;
  if (!entry.page.isClosed()) {
    await entry.page.close();
  }
  tabs.delete(index);
  if (activeTabIndex === index) {
    const remaining = [...tabs.keys()];
    activeTabIndex = remaining.length > 0 ? remaining[0] : 0;
  }
  return true;
}

export async function cleanup(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  for (const [index, entry] of tabs) {
    if (!entry.page.isClosed()) {
      await entry.page.close();
    }
    tabs.delete(index);
  }
  await adapter.close();
  nextTabIndex = 0;
  activeTabIndex = 0;
}

/**
 * Get the accessibility tree snapshot for the active tab's page.
 */
export async function getPageSnapshot(): Promise<{
  tree: AccessibilityNode | null;
  title: string;
  url: string;
  page: BrowserPage;
} | null> {
  const tab = getActiveTab();
  if (!tab) return null;
  const { page } = tab;

  const tree = await page.getAccessibilityTree();
  const title = await page.title();
  const url = page.url();
  return { tree, title, url, page };
}
