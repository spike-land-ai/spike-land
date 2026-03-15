/**
 * Browser Session Durable Object
 *
 * Manages a browser session per client on Cloudflare Workers.
 * Uses the Browser Rendering API via PuppeteerAdapter.
 * 90-second alarm for auto-cleanup (under CF's 2-min limit).
 */

import { DurableObject } from "cloudflare:workers";
import type { Env } from "../core-logic/env.js";
import type { BrowserPage } from "../core-logic/adapter.js";
import { PuppeteerAdapter } from "./adapter-puppeteer.js";
import {
  narrate,
  narrateCompact,
  narrateCompactSection,
  narrateSection,
  findElementByRef,
} from "../core-logic/narrate.js";
import type { AccessibilityNode } from "../core-logic/types.js";

interface TabState {
  page: BrowserPage;
  index: number;
}

export class BrowserSessionDO extends DurableObject<Env> {
  private adapter: PuppeteerAdapter | null = null;
  private tabs = new Map<number, TabState>();
  private activeTabIndex = 0;
  private nextTabIndex = 0;

  private getAdapter(): PuppeteerAdapter {
    if (!this.adapter) {
      this.adapter = new PuppeteerAdapter(this.env.BROWSER);
    }
    return this.adapter;
  }

  private async resetAlarm(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + 90_000);
  }

  override async alarm(): Promise<void> {
    await this.snapshotAndClose();
  }

  private async snapshotAndClose(): Promise<void> {
    for (const [, t] of this.tabs) {
      if (!t.page.isClosed()) await t.page.close();
    }
    this.tabs.clear();

    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
    }
    this.nextTabIndex = 0;
    this.activeTabIndex = 0;
  }

  private async ensureTab(index?: number): Promise<TabState> {
    const adapter = this.getAdapter();

    if (index !== undefined) {
      const existing = this.tabs.get(index);
      if (existing) {
        this.activeTabIndex = index;
        return existing;
      }
    }

    await adapter.launch();
    const page = await adapter.newPage();
    const tabIndex = this.nextTabIndex++;
    const tab: TabState = { page, index: tabIndex };
    this.tabs.set(tabIndex, tab);
    this.activeTabIndex = tabIndex;
    await this.resetAlarm();
    return tab;
  }

  private getActiveTab(): TabState | null {
    const tab = this.tabs.get(this.activeTabIndex);
    if (!tab || tab.page.isClosed()) return null;
    return tab;
  }

  private async getSnapshot(): Promise<{
    tree: AccessibilityNode | null;
    title: string;
    url: string;
    page: BrowserPage;
  } | null> {
    const tab = this.getActiveTab();
    if (!tab) return null;
    const tree = await tab.page.getAccessibilityTree();
    const title = await tab.page.title();
    const url = tab.page.url();
    return { tree, title, url, page: tab.page };
  }

  // ─── RPC Methods (called from worker-entry via DO stub) ──────────────────

  async navigate(url: string, waitUntil: string = "load", tabIndex?: number): Promise<string> {
    const tab = await this.ensureTab(tabIndex);
    await tab.page.goto(url, { waitUntil });
    return this.readPage("compact");
  }

  async readPage(
    detail: "compact" | "full" | "landmark" = "compact",
    landmark?: string,
  ): Promise<string> {
    await this.resetAlarm();
    const snapshot = await this.getSnapshot();
    if (!snapshot) return "No active browser tab. Use web_navigate first.";
    if (!snapshot.tree) return `[Page: "${snapshot.title}" - ${snapshot.url}]\n[Empty page]`;

    if (landmark) {
      const fn = detail === "full" ? narrateSection : narrateCompactSection;
      return fn(snapshot.tree, landmark, snapshot.title, snapshot.url).text;
    }
    const fn = detail === "full" ? narrate : narrateCompact;
    return fn(snapshot.tree, snapshot.title, snapshot.url).text;
  }

  async click(ref?: number, role?: string, name?: string): Promise<string> {
    await this.resetAlarm();
    const snapshot = await this.getSnapshot();
    if (!snapshot?.tree) return "No active browser tab.";

    if (ref !== undefined) {
      const node = findElementByRef(snapshot.tree, ref);
      if (!node) return `No element with ref=${ref}.`;
      const locator = snapshot.page.getByRole(
        node.role,
        node.name !== undefined ? { name: node.name } : undefined,
      );
      await locator.click();
    } else if (role) {
      const opts = name ? { name } : undefined;
      await snapshot.page.getByRole(role, opts).click();
    } else {
      return "Provide ref or role.";
    }
    return this.readPage("compact");
  }

  async type(text: string, ref?: number, name?: string, clear: boolean = true): Promise<string> {
    await this.resetAlarm();
    const snapshot = await this.getSnapshot();
    if (!snapshot?.tree) return "No active browser tab.";

    let role = "textbox";
    let targetName = name;
    if (ref !== undefined) {
      const node = findElementByRef(snapshot.tree, ref);
      if (!node) return `No element with ref=${ref}.`;
      role = node.role;
      targetName = node.name;
    }

    const locator = snapshot.page.getByRole(role, targetName ? { name: targetName } : undefined);
    if (clear) await locator.clear();
    await locator.fill(text);
    return this.readPage("compact");
  }

  async select(option: string, ref?: number, name?: string): Promise<string> {
    await this.resetAlarm();
    const snapshot = await this.getSnapshot();
    if (!snapshot?.tree) return "No active browser tab.";

    let role = "combobox";
    let targetName = name;
    if (ref !== undefined) {
      const node = findElementByRef(snapshot.tree, ref);
      if (!node) return `No element with ref=${ref}.`;
      role = node.role;
      targetName = node.name;
    }

    await snapshot.page
      .getByRole(role, targetName ? { name: targetName } : undefined)
      .selectOption(option);
    return this.readPage("compact");
  }

  async press(key: string): Promise<string> {
    await this.resetAlarm();
    const tab = this.getActiveTab();
    if (!tab) return "No active browser tab.";
    await tab.page.keyboard.press(key);
    return this.readPage("compact");
  }

  async scroll(direction: "up" | "down" = "down", amount: number = 1): Promise<string> {
    await this.resetAlarm();
    const tab = this.getActiveTab();
    if (!tab) return "No active browser tab.";
    const vp = tab.page.viewportSize();
    const height = vp?.height ?? 720;
    const delta = height * amount * (direction === "up" ? -1 : 1);
    await tab.page.mouse.wheel(0, delta);
    return this.readPage("compact");
  }

  async screenshot(fullPage: boolean = false): Promise<string> {
    await this.resetAlarm();
    const tab = this.getActiveTab();
    if (!tab) return "";
    return String(await tab.page.screenshot({ fullPage, encoding: "base64", type: "png" }));
  }

  async listTabs(): Promise<Array<{ index: number; url: string; title: string }>> {
    const result: Array<{ index: number; url: string; title: string }> = [];
    for (const [index, tab] of this.tabs) {
      if (tab.page.isClosed()) {
        this.tabs.delete(index);
        continue;
      }
      result.push({ index, url: tab.page.url(), title: await tab.page.title() });
    }
    return result;
  }

  async closeTab(index: number): Promise<boolean> {
    const tab = this.tabs.get(index);
    if (!tab) return false;
    if (!tab.page.isClosed()) await tab.page.close();
    this.tabs.delete(index);
    if (this.activeTabIndex === index) {
      const remaining = [...this.tabs.keys()];
      this.activeTabIndex = remaining[0] ?? 0;
    }
    return true;
  }
}
