import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useQaStudio } from "./useQaStudio";

// Mock the qa-studio server actions
vi.mock("@/lib/qa-studio/actions", () => ({
  qaNavigate: vi.fn(),
  qaScreenshot: vi.fn(),
  qaNetwork: vi.fn(),
  qaConsole: vi.fn(),
  qaViewport: vi.fn(),
  qaTestRun: vi.fn(),
  qaCoverage: vi.fn(),
  qaAccessibility: vi.fn(),
}));

import {
  qaAccessibility,
  qaConsole,
  qaCoverage,
  qaNavigate,
  qaNetwork,
  qaScreenshot,
  qaTestRun,
  qaViewport,
} from "@/lib/qa-studio/actions";

const mockQaNavigate = vi.mocked(qaNavigate);
const mockQaScreenshot = vi.mocked(qaScreenshot);
const mockQaNetwork = vi.mocked(qaNetwork);
const mockQaConsole = vi.mocked(qaConsole);
const mockQaViewport = vi.mocked(qaViewport);
const mockQaTestRun = vi.mocked(qaTestRun);
const mockQaCoverage = vi.mocked(qaCoverage);
const mockQaAccessibility = vi.mocked(qaAccessibility);

describe("useQaStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Initial State ──────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("has correct initial browser state", () => {
      const { result } = renderHook(() => useQaStudio());
      expect(result.current.state.browser.url).toBe("");
      expect(result.current.state.browser.currentUrl).toBe("");
      expect(result.current.state.browser.currentTitle).toBe("");
      expect(result.current.state.browser.navigationStatus).toBe("idle");
      expect(result.current.state.browser.navigationError).toBeNull();
      expect(result.current.state.browser.screenshotStatus).toBe("idle");
      expect(result.current.state.browser.screenshot).toBeNull();
      expect(result.current.state.browser.selectedViewport).toBe("desktop");
      expect(result.current.state.browser.fullPage).toBe(false);
      expect(result.current.state.browser.networkResult).toBeNull();
      expect(result.current.state.browser.networkStatus).toBe("idle");
      expect(result.current.state.browser.consoleMessages).toEqual([]);
      expect(result.current.state.browser.consoleStatus).toBe("idle");
      expect(result.current.state.browser.consoleLevel).toBe("info");
    });

    it("has correct initial test runner state", () => {
      const { result } = renderHook(() => useQaStudio());
      expect(result.current.state.testRunner.target).toBe("");
      expect(result.current.state.testRunner.status).toBe("idle");
      expect(result.current.state.testRunner.result).toBeNull();
      expect(result.current.state.testRunner.error).toBeNull();
      expect(result.current.state.testRunner.history).toEqual([]);
    });

    it("has correct initial coverage state", () => {
      const { result } = renderHook(() => useQaStudio());
      expect(result.current.state.coverage.target).toBe("");
      expect(result.current.state.coverage.status).toBe("idle");
      expect(result.current.state.coverage.result).toBeNull();
      expect(result.current.state.coverage.error).toBeNull();
    });

    it("has correct initial a11y state", () => {
      const { result } = renderHook(() => useQaStudio());
      expect(result.current.state.a11y.status).toBe("idle");
      expect(result.current.state.a11y.result).toBeNull();
      expect(result.current.state.a11y.error).toBeNull();
      expect(result.current.state.a11y.standard).toBe("wcag2aa");
    });
  });

  // ── Browser: URL & Viewport ────────────────────────────────────────────────

  describe("setUrl", () => {
    it("updates browser url in state", () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => {
        result.current.setUrl("https://example.com");
      });
      expect(result.current.state.browser.url).toBe("https://example.com");
    });
  });

  describe("setViewport", () => {
    it("updates selected viewport", async () => {
      mockQaViewport.mockResolvedValueOnce({ width: 375, height: 812, preset: "mobile" });
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.setViewport("mobile");
      });
      expect(result.current.state.browser.selectedViewport).toBe("mobile");
      expect(mockQaViewport).toHaveBeenCalledWith({ preset: "mobile" });
    });

    it("silently ignores qaViewport errors", async () => {
      mockQaViewport.mockRejectedValueOnce(new Error("Viewport failed"));
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.setViewport("tablet");
      });
      expect(result.current.state.browser.selectedViewport).toBe("tablet");
    });
  });

  describe("toggleFullPage", () => {
    it("toggles fullPage from false to true", () => {
      const { result } = renderHook(() => useQaStudio());
      expect(result.current.state.browser.fullPage).toBe(false);
      act(() => {
        result.current.toggleFullPage();
      });
      expect(result.current.state.browser.fullPage).toBe(true);
    });

    it("toggles fullPage back to false on second call", () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => {
        result.current.toggleFullPage();
        result.current.toggleFullPage();
      });
      expect(result.current.state.browser.fullPage).toBe(false);
    });
  });

  // ── Browser: Navigate ──────────────────────────────────────────────────────

  describe("navigate", () => {
    it("does nothing when url is empty", async () => {
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.navigate();
      });
      expect(mockQaNavigate).not.toHaveBeenCalled();
      expect(result.current.state.browser.navigationStatus).toBe("idle");
    });

    it("prepends https:// when url has no protocol", async () => {
      mockQaNavigate.mockResolvedValueOnce({ url: "https://example.com", title: "Example" });
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setUrl("example.com"));
      await act(async () => {
        await result.current.navigate();
      });
      expect(mockQaNavigate).toHaveBeenCalledWith("https://example.com");
    });

    it("does not modify url that already has https://", async () => {
      mockQaNavigate.mockResolvedValueOnce({ url: "https://example.com", title: "Example" });
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setUrl("https://example.com"));
      await act(async () => {
        await result.current.navigate();
      });
      expect(mockQaNavigate).toHaveBeenCalledWith("https://example.com");
    });

    it("does not modify url that already has http://", async () => {
      mockQaNavigate.mockResolvedValueOnce({ url: "http://localhost:3000", title: "Local" });
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setUrl("http://localhost:3000"));
      await act(async () => {
        await result.current.navigate();
      });
      expect(mockQaNavigate).toHaveBeenCalledWith("http://localhost:3000");
    });

    it("sets status to loading during navigation then success", async () => {
      let resolveNav!: (v: { url: string; title: string; }) => void;
      mockQaNavigate.mockReturnValueOnce(
        new Promise<{ url: string; title: string; }>(res => {
          resolveNav = res;
        }),
      );
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setUrl("https://example.com"));

      let navPromise: Promise<void>;
      act(() => {
        navPromise = result.current.navigate();
      });
      expect(result.current.state.browser.navigationStatus).toBe("loading");

      await act(async () => {
        resolveNav({ url: "https://example.com", title: "Example" });
        await navPromise;
      });
      expect(result.current.state.browser.navigationStatus).toBe("success");
      expect(result.current.state.browser.currentUrl).toBe("https://example.com");
      expect(result.current.state.browser.currentTitle).toBe("Example");
      expect(result.current.state.browser.navigationError).toBeNull();
    });

    it("sets error state on navigation failure", async () => {
      mockQaNavigate.mockRejectedValueOnce(new Error("Network error"));
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setUrl("https://broken.com"));
      await act(async () => {
        await result.current.navigate();
      });
      expect(result.current.state.browser.navigationStatus).toBe("error");
      expect(result.current.state.browser.navigationError).toBe("Network error");
    });

    it("accepts a rawUrl parameter that overrides state url", async () => {
      mockQaNavigate.mockResolvedValueOnce({ url: "https://override.com", title: "Override" });
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.navigate("override.com");
      });
      expect(mockQaNavigate).toHaveBeenCalledWith("https://override.com");
    });
  });

  // ── Browser: Screenshot ────────────────────────────────────────────────────

  describe("captureScreenshot", () => {
    it("dispatches success with result", async () => {
      const screenshotResult = { base64: "abc123", url: "https://example.com", fullPage: false };
      mockQaScreenshot.mockResolvedValueOnce(screenshotResult);
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.captureScreenshot();
      });
      expect(result.current.state.browser.screenshotStatus).toBe("success");
      expect(result.current.state.browser.screenshot).toEqual(screenshotResult);
      expect(result.current.state.browser.screenshotError).toBeNull();
    });

    it("dispatches error when action returns error object", async () => {
      mockQaScreenshot.mockResolvedValueOnce({ error: "Browser not navigated" });
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.captureScreenshot();
      });
      expect(result.current.state.browser.screenshotStatus).toBe("error");
      expect(result.current.state.browser.screenshotError).toBe("Browser not navigated");
    });

    it("dispatches error when action throws", async () => {
      mockQaScreenshot.mockRejectedValueOnce(new Error("Playwright error"));
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.captureScreenshot();
      });
      expect(result.current.state.browser.screenshotStatus).toBe("error");
      expect(result.current.state.browser.screenshotError).toBe("Playwright error");
    });

    it("passes fullPage flag from state", async () => {
      const screenshotResult = { base64: "xyz", url: "https://example.com", fullPage: true };
      mockQaScreenshot.mockResolvedValueOnce(screenshotResult);
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.toggleFullPage());
      await act(async () => {
        await result.current.captureScreenshot();
      });
      expect(mockQaScreenshot).toHaveBeenCalledWith({ fullPage: true });
    });
  });

  // ── Browser: Network ───────────────────────────────────────────────────────

  describe("fetchNetwork", () => {
    it("dispatches success with network result", async () => {
      const networkResult = {
        requests: [{
          url: "/api",
          method: "GET",
          resourceType: "fetch",
          status: 200,
          contentLength: "512",
        }],
        totalSize: 512,
        errorCount: 0,
      };
      mockQaNetwork.mockResolvedValueOnce(networkResult);
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchNetwork();
      });
      expect(result.current.state.browser.networkStatus).toBe("success");
      expect(result.current.state.browser.networkResult).toEqual(networkResult);
    });

    it("dispatches error when action returns error object", async () => {
      mockQaNetwork.mockResolvedValueOnce({ error: "No page loaded" });
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchNetwork();
      });
      expect(result.current.state.browser.networkStatus).toBe("error");
      expect(result.current.state.browser.networkError).toBe("No page loaded");
    });

    it("dispatches error when action throws", async () => {
      mockQaNetwork.mockRejectedValueOnce(new Error("Network fetch failed"));
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchNetwork();
      });
      expect(result.current.state.browser.networkStatus).toBe("error");
      expect(result.current.state.browser.networkError).toBe("Network fetch failed");
    });
  });

  // ── Browser: Console ───────────────────────────────────────────────────────

  describe("setConsoleLevel", () => {
    it("updates console level in state", () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setConsoleLevel("error"));
      expect(result.current.state.browser.consoleLevel).toBe("error");
    });
  });

  describe("fetchConsole", () => {
    it("dispatches success with console messages", async () => {
      const messages = [{ type: "error", text: "Something failed", url: "/app", line: 42 }];
      mockQaConsole.mockResolvedValueOnce(messages);
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchConsole();
      });
      expect(result.current.state.browser.consoleStatus).toBe("success");
      expect(result.current.state.browser.consoleMessages).toEqual(messages);
    });

    it("uses current consoleLevel from state when no level arg provided", async () => {
      mockQaConsole.mockResolvedValueOnce([]);
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setConsoleLevel("debug"));
      await act(async () => {
        await result.current.fetchConsole();
      });
      expect(mockQaConsole).toHaveBeenCalledWith("debug");
    });

    it("uses provided level arg when given", async () => {
      mockQaConsole.mockResolvedValueOnce([]);
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchConsole("warning");
      });
      expect(mockQaConsole).toHaveBeenCalledWith("warning");
    });

    it("dispatches error when action returns error object", async () => {
      mockQaConsole.mockResolvedValueOnce({ error: "Console unavailable" });
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchConsole();
      });
      expect(result.current.state.browser.consoleStatus).toBe("error");
      expect(result.current.state.browser.consoleError).toBe("Console unavailable");
    });

    it("dispatches error when action throws", async () => {
      mockQaConsole.mockRejectedValueOnce(new Error("Console fetch failed"));
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.fetchConsole();
      });
      expect(result.current.state.browser.consoleStatus).toBe("error");
      expect(result.current.state.browser.consoleError).toBe("Console fetch failed");
    });
  });

  // ── Test Runner ────────────────────────────────────────────────────────────

  describe("setTestTarget", () => {
    it("updates test runner target", () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setTestTarget("src/lib/mcp/"));
      expect(result.current.state.testRunner.target).toBe("src/lib/mcp/");
    });
  });

  describe("runTests", () => {
    it("does nothing when target is empty", async () => {
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.runTests();
      });
      expect(mockQaTestRun).not.toHaveBeenCalled();
    });

    it("does nothing when target is only whitespace", async () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setTestTarget("   "));
      await act(async () => {
        await result.current.runTests();
      });
      expect(mockQaTestRun).not.toHaveBeenCalled();
    });

    it("dispatches success and updates history", async () => {
      const testResult = { passed: true, output: "All 5 tests passed", target: "src/lib/mcp/" };
      mockQaTestRun.mockResolvedValueOnce(testResult);
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setTestTarget("src/lib/mcp/"));
      await act(async () => {
        await result.current.runTests();
      });
      expect(result.current.state.testRunner.status).toBe("success");
      expect(result.current.state.testRunner.result).toEqual(testResult);
      expect(result.current.state.testRunner.error).toBeNull();
      expect(result.current.state.testRunner.history).toHaveLength(1);
      expect(result.current.state.testRunner.history[0]!.target).toBe("src/lib/mcp/");
      expect(result.current.state.testRunner.history[0]!.passed).toBe(true);
    });

    it("caps history at 10 entries", async () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setTestTarget("src/file.ts"));

      for (let i = 0; i < 12; i++) {
        mockQaTestRun.mockResolvedValueOnce({ passed: true, output: "ok", target: `file-${i}.ts` });
        await act(async () => {
          await result.current.runTests();
        });
      }
      expect(result.current.state.testRunner.history.length).toBeLessThanOrEqual(10);
    });

    it("dispatches error on test run failure", async () => {
      mockQaTestRun.mockRejectedValueOnce(new Error("Test run failed"));
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setTestTarget("src/lib/broken.ts"));
      await act(async () => {
        await result.current.runTests();
      });
      expect(result.current.state.testRunner.status).toBe("error");
      expect(result.current.state.testRunner.error).toBe("Test run failed");
    });
  });

  // ── Coverage ───────────────────────────────────────────────────────────────

  describe("setCoverageTarget", () => {
    it("updates coverage target", () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setCoverageTarget("src/lib/mcp/"));
      expect(result.current.state.coverage.target).toBe("src/lib/mcp/");
    });
  });

  describe("analyzeCoverage", () => {
    it("does nothing when target is empty", async () => {
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.analyzeCoverage();
      });
      expect(mockQaCoverage).not.toHaveBeenCalled();
    });

    it("dispatches success with coverage result", async () => {
      const coverageResult = {
        target: "src/lib/mcp/",
        lines: 85.5,
        functions: 90.0,
        branches: 78.3,
        statements: 86.1,
        raw: "Coverage output here",
      };
      mockQaCoverage.mockResolvedValueOnce(coverageResult);
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setCoverageTarget("src/lib/mcp/"));
      await act(async () => {
        await result.current.analyzeCoverage();
      });
      expect(result.current.state.coverage.status).toBe("success");
      expect(result.current.state.coverage.result).toEqual(coverageResult);
      expect(result.current.state.coverage.error).toBeNull();
    });

    it("dispatches error on coverage failure", async () => {
      mockQaCoverage.mockRejectedValueOnce(new Error("Coverage analysis failed"));
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setCoverageTarget("src/"));
      await act(async () => {
        await result.current.analyzeCoverage();
      });
      expect(result.current.state.coverage.status).toBe("error");
      expect(result.current.state.coverage.error).toBe("Coverage analysis failed");
    });
  });

  // ── A11y ───────────────────────────────────────────────────────────────────

  describe("setA11yStandard", () => {
    it("updates a11y standard", () => {
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setA11yStandard("wcag2a"));
      expect(result.current.state.a11y.standard).toBe("wcag2a");
    });
  });

  describe("runA11yScan", () => {
    it("dispatches success with a11y result", async () => {
      const a11yResult = {
        score: 92,
        violations: [],
        standard: "wcag2aa",
      };
      mockQaAccessibility.mockResolvedValueOnce(a11yResult);
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.runA11yScan();
      });
      expect(result.current.state.a11y.status).toBe("success");
      expect(result.current.state.a11y.result).toEqual(a11yResult);
      expect(result.current.state.a11y.error).toBeNull();
    });

    it("dispatches error when action returns error object", async () => {
      mockQaAccessibility.mockResolvedValueOnce({ error: "No page loaded" });
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.runA11yScan();
      });
      expect(result.current.state.a11y.status).toBe("error");
      expect(result.current.state.a11y.error).toBe("No page loaded");
    });

    it("dispatches error when action throws", async () => {
      mockQaAccessibility.mockRejectedValueOnce(new Error("Accessibility scan failed"));
      const { result } = renderHook(() => useQaStudio());
      await act(async () => {
        await result.current.runA11yScan();
      });
      expect(result.current.state.a11y.status).toBe("error");
      expect(result.current.state.a11y.error).toBe("Accessibility scan failed");
    });

    it("passes current a11y standard to the action", async () => {
      mockQaAccessibility.mockResolvedValueOnce({
        score: 80,
        violations: [],
        standard: "wcag21aa",
      });
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setA11yStandard("wcag21aa"));
      await act(async () => {
        await result.current.runA11yScan();
      });
      expect(mockQaAccessibility).toHaveBeenCalledWith("wcag21aa");
    });

    it("shows loading status during scan", async () => {
      let resolveScan!: (v: { score: number; violations: never[]; standard: string; }) => void;
      mockQaAccessibility.mockReturnValueOnce(
        new Promise<{ score: number; violations: never[]; standard: string; }>(res => {
          resolveScan = res;
        }),
      );
      const { result } = renderHook(() => useQaStudio());
      let scanPromise: Promise<void>;
      act(() => {
        scanPromise = result.current.runA11yScan();
      });
      expect(result.current.state.a11y.status).toBe("loading");
      await act(async () => {
        resolveScan({ score: 100, violations: [], standard: "wcag2aa" });
        await scanPromise;
      });
      expect(result.current.state.a11y.status).toBe("success");
    });
  });

  // ── Non-Error unknown throws ───────────────────────────────────────────────

  describe("non-Error thrown values", () => {
    it("navigate uses fallback message for non-Error throws", async () => {
      mockQaNavigate.mockRejectedValueOnce("string error");
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setUrl("https://test.com"));
      await act(async () => {
        await result.current.navigate();
      });
      expect(result.current.state.browser.navigationError).toBe("Navigation failed");
    });

    it("runTests uses fallback message for non-Error throws", async () => {
      mockQaTestRun.mockRejectedValueOnce(42);
      const { result } = renderHook(() => useQaStudio());
      act(() => result.current.setTestTarget("src/file.ts"));
      await act(async () => {
        await result.current.runTests();
      });
      expect(result.current.state.testRunner.error).toBe("Test run failed");
    });
  });
});
