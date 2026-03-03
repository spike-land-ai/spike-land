import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigWatcher } from "../../config/watcher.js";
import type { ResolvedConfig } from "../../config/types.js";

// Mock fs.watch
const mockWatcher = {
  close: vi.fn(),
  _callback: null as (() => void) | null,
};

vi.mock("node:fs", () => ({
  watch: vi.fn((_path: string, callback: () => void) => {
    mockWatcher._callback = callback;
    return mockWatcher;
  }),
}));

vi.mock("../../config/discovery.js", () => ({
  discoverConfig: vi.fn().mockResolvedValue({
    servers: { newServer: { command: "node", args: ["new.js"] } },
  }),
}));

describe("ConfigWatcher", () => {
  const onChange = vi.fn<(newConfig: ResolvedConfig) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates watchers for all config paths", async () => {
    const { watch } = await import("node:fs");
    const watcher = new ConfigWatcher({
      configPaths: ["/path/a.json", "/path/b.json"],
      discoveryOptions: {},
      onChange,
    });

    watcher.start();
    expect(watch).toHaveBeenCalledTimes(2);
    watcher.stop();
  });

  it("stops all watchers", () => {
    const watcher = new ConfigWatcher({
      configPaths: ["/path/a.json"],
      discoveryOptions: {},
      onChange,
    });

    watcher.start();
    watcher.stop();
    expect(mockWatcher.close).toHaveBeenCalled();
  });

  it("debounces rapid changes", async () => {
    const watcher = new ConfigWatcher({
      configPaths: ["/path/a.json"],
      discoveryOptions: {},
      onChange,
      debounceMs: 100,
    });

    watcher.start();

    // Simulate rapid file changes
    const callback = mockWatcher._callback!;
    callback();
    callback();
    callback();

    // Before debounce expires
    expect(onChange).not.toHaveBeenCalled();

    // After debounce
    await vi.advanceTimersByTimeAsync(150);

    // Should have called onChange only once
    expect(onChange).toHaveBeenCalledTimes(1);
    watcher.stop();
  });
});
