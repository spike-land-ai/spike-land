import { afterEach, beforeEach, describe, expect, it } from "vitest";

interface MockRouterEvent {
  hrefChanged: boolean;
  pathChanged: boolean;
  toLocation: {
    href: string;
  };
}

type RouterEventType = "onBeforeLoad" | "onResolved";

function setMockLocation(url: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: new URL(url),
  });
}

function createMockRouter() {
  const listeners: Record<RouterEventType, Array<(event: MockRouterEvent) => void>> = {
    onBeforeLoad: [],
    onResolved: [],
  };

  return {
    emit(eventType: RouterEventType, event: MockRouterEvent) {
      for (const listener of listeners[eventType]) {
        listener(event);
      }
    },
    subscribe(eventType: RouterEventType, listener: (event: MockRouterEvent) => void) {
      listeners[eventType].push(listener);
      return () => {
        const index = listeners[eventType].indexOf(listener);
        if (index >= 0) {
          listeners[eventType].splice(index, 1);
        }
      };
    },
  };
}

describe("pageLoadCounter", () => {
  beforeEach(() => {
    vi.resetModules();
    setMockLocation("https://dev.spike.land/apps");
  });

  afterEach(async () => {
    const { resetPageLoadCounter } = await import("../pageLoadCounter");
    resetPageLoadCounter();
  });

  it("tracks active loads in window globals and document dataset", async () => {
    const { beginPageLoad, finishPageLoad, getPageLoadSnapshot } = await import(
      "../pageLoadCounter"
    );

    const loadId = beginPageLoad({
      href: "https://dev.spike.land/docs/testing",
      kind: "navigation",
    });

    expect(loadId).toBe("page-load-1");
    expect(window.__spikePageLoadCounter).toBe(1);
    expect(document.documentElement.dataset.pageLoadCount).toBe("1");
    expect(document.documentElement.dataset.pageLoadStarted).toBe("1");
    expect(document.documentElement.dataset.pageLoadFinished).toBe("0");
    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 1,
      totalStarted: 1,
      totalFinished: 0,
      activeLoads: [
        {
          id: "page-load-1",
          href: "https://dev.spike.land/docs/testing",
          kind: "navigation",
        },
      ],
    });

    expect(finishPageLoad(loadId)).toBe(true);
    expect(finishPageLoad(loadId)).toBe(false);
    expect(window.__spikePageLoadCounter).toBe(0);
    expect(document.documentElement.dataset.pageLoadCount).toBe("0");
    expect(document.documentElement.dataset.pageLoadStarted).toBe("1");
    expect(document.documentElement.dataset.pageLoadFinished).toBe("1");
  });

  it("reuses and finishes the bootstrap page load", async () => {
    const { beginBootstrapPageLoad, finishBootstrapPageLoad, getPageLoadSnapshot } = await import(
      "../pageLoadCounter"
    );

    const firstId = beginBootstrapPageLoad("https://dev.spike.land/");
    const secondId = beginBootstrapPageLoad("https://dev.spike.land/ignored");

    expect(firstId).toBe("page-load-1");
    expect(secondId).toBe(firstId);
    expect(getPageLoadSnapshot().activeLoads[0]).toMatchObject({
      id: firstId,
      kind: "bootstrap",
      href: "https://dev.spike.land/",
    });

    expect(finishBootstrapPageLoad()).toBe(true);
    expect(finishBootstrapPageLoad()).toBe(false);
    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 0,
      totalStarted: 1,
      totalFinished: 1,
    });
  });

  it("brackets router lifecycle events with bootstrap and navigation loads", async () => {
    const { beginBootstrapPageLoad, connectPageLoadCounter, getPageLoadSnapshot } = await import(
      "../pageLoadCounter"
    );

    const router = createMockRouter();
    beginBootstrapPageLoad("https://dev.spike.land/apps");
    const disconnect = connectPageLoadCounter(router);

    router.emit("onBeforeLoad", {
      hrefChanged: true,
      pathChanged: true,
      toLocation: { href: "https://dev.spike.land/docs/testing" },
    });

    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 2,
      totalStarted: 2,
      totalFinished: 0,
    });

    router.emit("onResolved", {
      hrefChanged: true,
      pathChanged: true,
      toLocation: { href: "https://dev.spike.land/docs/testing" },
    });

    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 0,
      totalStarted: 2,
      totalFinished: 2,
    });

    disconnect();
    expect(getPageLoadSnapshot().activeCount).toBe(0);
  });

  it("replaces stale navigation loads and ignores unchanged locations", async () => {
    const { connectPageLoadCounter, getPageLoadSnapshot } = await import("../pageLoadCounter");

    const router = createMockRouter();
    const disconnect = connectPageLoadCounter(router);

    router.emit("onBeforeLoad", {
      hrefChanged: true,
      pathChanged: true,
      toLocation: { href: "https://dev.spike.land/apps/first" },
    });

    router.emit("onBeforeLoad", {
      hrefChanged: true,
      pathChanged: true,
      toLocation: { href: "https://dev.spike.land/apps/second" },
    });

    router.emit("onBeforeLoad", {
      hrefChanged: false,
      pathChanged: false,
      toLocation: { href: "https://dev.spike.land/apps/second#hash" },
    });

    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 1,
      totalStarted: 2,
      totalFinished: 1,
      activeLoads: [
        {
          href: "https://dev.spike.land/apps/second",
          kind: "navigation",
        },
      ],
    });

    router.emit("onResolved", {
      hrefChanged: true,
      pathChanged: true,
      toLocation: { href: "https://dev.spike.land/apps/second" },
    });

    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 0,
      totalStarted: 2,
      totalFinished: 2,
    });

    disconnect();
  });

  it("cleans up an unfinished navigation when disconnected", async () => {
    const { connectPageLoadCounter, getPageLoadSnapshot } = await import("../pageLoadCounter");

    const router = createMockRouter();
    const disconnect = connectPageLoadCounter(router);

    router.emit("onBeforeLoad", {
      hrefChanged: true,
      pathChanged: true,
      toLocation: { href: "https://dev.spike.land/pricing" },
    });

    expect(getPageLoadSnapshot().activeCount).toBe(1);

    disconnect();

    expect(getPageLoadSnapshot()).toMatchObject({
      activeCount: 0,
      totalStarted: 1,
      totalFinished: 1,
    });
  });
});
