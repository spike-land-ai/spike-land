"use client";

import { useCallback, useReducer } from "react";
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
import type {
  QaAccessibilityResult,
  QaConsoleMessage,
  QaCoverageResult,
  QaNetworkResult,
  QaScreenshotResult,
  QaTestResult,
} from "@/lib/qa-studio/types";
import { isActionError } from "@/lib/qa-studio/types";

export type PanelStatus = "idle" | "loading" | "success" | "error";

export type ViewportPreset = "mobile" | "tablet" | "desktop";

export interface BrowserState {
  url: string;
  currentUrl: string;
  currentTitle: string;
  navigationStatus: PanelStatus;
  navigationError: string | null;
  screenshot: QaScreenshotResult | null;
  screenshotStatus: PanelStatus;
  screenshotError: string | null;
  selectedViewport: ViewportPreset;
  fullPage: boolean;
  networkResult: QaNetworkResult | null;
  networkStatus: PanelStatus;
  networkError: string | null;
  consoleMessages: QaConsoleMessage[];
  consoleStatus: PanelStatus;
  consoleError: string | null;
  consoleLevel: "error" | "warning" | "info" | "debug";
}

export interface TestRunnerState {
  target: string;
  status: PanelStatus;
  result: QaTestResult | null;
  error: string | null;
  history: Array<{ target: string; passed: boolean; timestamp: number; }>;
}

export interface CoverageState {
  target: string;
  status: PanelStatus;
  result: QaCoverageResult | null;
  error: string | null;
}

export interface A11yState {
  status: PanelStatus;
  result: QaAccessibilityResult | null;
  error: string | null;
  standard: "wcag2a" | "wcag2aa" | "wcag21aa";
}

export interface QaStudioState {
  browser: BrowserState;
  testRunner: TestRunnerState;
  coverage: CoverageState;
  a11y: A11yState;
}

type QaStudioAction =
  | { type: "BROWSER_SET_URL"; payload: string; }
  | { type: "BROWSER_NAVIGATE_START"; }
  | {
    type: "BROWSER_NAVIGATE_SUCCESS";
    payload: { url: string; title: string; };
  }
  | { type: "BROWSER_NAVIGATE_ERROR"; payload: string; }
  | { type: "BROWSER_SET_VIEWPORT"; payload: ViewportPreset; }
  | { type: "BROWSER_TOGGLE_FULLPAGE"; }
  | { type: "BROWSER_SCREENSHOT_START"; }
  | { type: "BROWSER_SCREENSHOT_SUCCESS"; payload: QaScreenshotResult; }
  | { type: "BROWSER_SCREENSHOT_ERROR"; payload: string; }
  | { type: "BROWSER_NETWORK_START"; }
  | { type: "BROWSER_NETWORK_SUCCESS"; payload: QaNetworkResult; }
  | { type: "BROWSER_NETWORK_ERROR"; payload: string; }
  | { type: "BROWSER_CONSOLE_START"; }
  | { type: "BROWSER_CONSOLE_SUCCESS"; payload: QaConsoleMessage[]; }
  | { type: "BROWSER_CONSOLE_ERROR"; payload: string; }
  | {
    type: "BROWSER_SET_CONSOLE_LEVEL";
    payload: "error" | "warning" | "info" | "debug";
  }
  | { type: "TEST_SET_TARGET"; payload: string; }
  | { type: "TEST_RUN_START"; }
  | { type: "TEST_RUN_SUCCESS"; payload: QaTestResult; }
  | { type: "TEST_RUN_ERROR"; payload: string; }
  | { type: "COVERAGE_SET_TARGET"; payload: string; }
  | { type: "COVERAGE_RUN_START"; }
  | { type: "COVERAGE_RUN_SUCCESS"; payload: QaCoverageResult; }
  | { type: "COVERAGE_RUN_ERROR"; payload: string; }
  | { type: "A11Y_SET_STANDARD"; payload: "wcag2a" | "wcag2aa" | "wcag21aa"; }
  | { type: "A11Y_SCAN_START"; }
  | { type: "A11Y_SCAN_SUCCESS"; payload: QaAccessibilityResult; }
  | { type: "A11Y_SCAN_ERROR"; payload: string; };

const initialState: QaStudioState = {
  browser: {
    url: "",
    currentUrl: "",
    currentTitle: "",
    navigationStatus: "idle",
    navigationError: null,
    screenshot: null,
    screenshotStatus: "idle",
    screenshotError: null,
    selectedViewport: "desktop",
    fullPage: false,
    networkResult: null,
    networkStatus: "idle",
    networkError: null,
    consoleMessages: [],
    consoleStatus: "idle",
    consoleError: null,
    consoleLevel: "info",
  },
  testRunner: {
    target: "",
    status: "idle",
    result: null,
    error: null,
    history: [],
  },
  coverage: {
    target: "",
    status: "idle",
    result: null,
    error: null,
  },
  a11y: {
    status: "idle",
    result: null,
    error: null,
    standard: "wcag2aa",
  },
};

function qaStudioReducer(
  state: QaStudioState,
  action: QaStudioAction,
): QaStudioState {
  switch (action.type) {
    case "BROWSER_SET_URL":
      return { ...state, browser: { ...state.browser, url: action.payload } };
    case "BROWSER_NAVIGATE_START":
      return {
        ...state,
        browser: {
          ...state.browser,
          navigationStatus: "loading",
          navigationError: null,
        },
      };
    case "BROWSER_NAVIGATE_SUCCESS":
      return {
        ...state,
        browser: {
          ...state.browser,
          navigationStatus: "success",
          currentUrl: action.payload.url,
          currentTitle: action.payload.title,
          url: action.payload.url,
          navigationError: null,
        },
      };
    case "BROWSER_NAVIGATE_ERROR":
      return {
        ...state,
        browser: {
          ...state.browser,
          navigationStatus: "error",
          navigationError: action.payload,
        },
      };
    case "BROWSER_SET_VIEWPORT":
      return {
        ...state,
        browser: { ...state.browser, selectedViewport: action.payload },
      };
    case "BROWSER_TOGGLE_FULLPAGE":
      return {
        ...state,
        browser: { ...state.browser, fullPage: !state.browser.fullPage },
      };
    case "BROWSER_SCREENSHOT_START":
      return {
        ...state,
        browser: {
          ...state.browser,
          screenshotStatus: "loading",
          screenshotError: null,
        },
      };
    case "BROWSER_SCREENSHOT_SUCCESS":
      return {
        ...state,
        browser: {
          ...state.browser,
          screenshotStatus: "success",
          screenshot: action.payload,
          screenshotError: null,
        },
      };
    case "BROWSER_SCREENSHOT_ERROR":
      return {
        ...state,
        browser: {
          ...state.browser,
          screenshotStatus: "error",
          screenshotError: action.payload,
        },
      };
    case "BROWSER_NETWORK_START":
      return {
        ...state,
        browser: {
          ...state.browser,
          networkStatus: "loading",
          networkError: null,
        },
      };
    case "BROWSER_NETWORK_SUCCESS":
      return {
        ...state,
        browser: {
          ...state.browser,
          networkStatus: "success",
          networkResult: action.payload,
          networkError: null,
        },
      };
    case "BROWSER_NETWORK_ERROR":
      return {
        ...state,
        browser: {
          ...state.browser,
          networkStatus: "error",
          networkError: action.payload,
        },
      };
    case "BROWSER_CONSOLE_START":
      return {
        ...state,
        browser: {
          ...state.browser,
          consoleStatus: "loading",
          consoleError: null,
        },
      };
    case "BROWSER_CONSOLE_SUCCESS":
      return {
        ...state,
        browser: {
          ...state.browser,
          consoleStatus: "success",
          consoleMessages: action.payload,
          consoleError: null,
        },
      };
    case "BROWSER_CONSOLE_ERROR":
      return {
        ...state,
        browser: {
          ...state.browser,
          consoleStatus: "error",
          consoleError: action.payload,
        },
      };
    case "BROWSER_SET_CONSOLE_LEVEL":
      return {
        ...state,
        browser: { ...state.browser, consoleLevel: action.payload },
      };
    case "TEST_SET_TARGET":
      return {
        ...state,
        testRunner: { ...state.testRunner, target: action.payload },
      };
    case "TEST_RUN_START":
      return {
        ...state,
        testRunner: { ...state.testRunner, status: "loading", error: null },
      };
    case "TEST_RUN_SUCCESS":
      return {
        ...state,
        testRunner: {
          ...state.testRunner,
          status: "success",
          result: action.payload,
          error: null,
          history: [
            {
              target: action.payload.target,
              passed: action.payload.passed,
              timestamp: Date.now(),
            },
            ...state.testRunner.history.slice(0, 9),
          ],
        },
      };
    case "TEST_RUN_ERROR":
      return {
        ...state,
        testRunner: {
          ...state.testRunner,
          status: "error",
          error: action.payload,
        },
      };
    case "COVERAGE_SET_TARGET":
      return {
        ...state,
        coverage: { ...state.coverage, target: action.payload },
      };
    case "COVERAGE_RUN_START":
      return {
        ...state,
        coverage: { ...state.coverage, status: "loading", error: null },
      };
    case "COVERAGE_RUN_SUCCESS":
      return {
        ...state,
        coverage: {
          ...state.coverage,
          status: "success",
          result: action.payload,
          error: null,
        },
      };
    case "COVERAGE_RUN_ERROR":
      return {
        ...state,
        coverage: { ...state.coverage, status: "error", error: action.payload },
      };
    case "A11Y_SET_STANDARD":
      return { ...state, a11y: { ...state.a11y, standard: action.payload } };
    case "A11Y_SCAN_START":
      return {
        ...state,
        a11y: { ...state.a11y, status: "loading", error: null },
      };
    case "A11Y_SCAN_SUCCESS":
      return {
        ...state,
        a11y: {
          ...state.a11y,
          status: "success",
          result: action.payload,
          error: null,
        },
      };
    case "A11Y_SCAN_ERROR":
      return {
        ...state,
        a11y: { ...state.a11y, status: "error", error: action.payload },
      };
    default:
      return state;
  }
}

export function useQaStudio() {
  const [state, dispatch] = useReducer(qaStudioReducer, initialState);

  // ── Browser Actions ─────────────────────────────────────────────
  const setUrl = useCallback((url: string) => {
    dispatch({ type: "BROWSER_SET_URL", payload: url });
  }, []);

  const navigate = useCallback(async (rawUrl?: string) => {
    const targetUrl = rawUrl ?? state.browser.url;
    if (!targetUrl.trim()) return;

    let normalizedUrl = targetUrl.trim();
    if (
      !normalizedUrl.startsWith("http://")
      && !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    dispatch({ type: "BROWSER_NAVIGATE_START" });
    try {
      const result = await qaNavigate(normalizedUrl);
      dispatch({ type: "BROWSER_NAVIGATE_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Navigation failed";
      dispatch({ type: "BROWSER_NAVIGATE_ERROR", payload: message });
    }
  }, [state.browser.url]);

  const setViewport = useCallback(async (preset: ViewportPreset) => {
    dispatch({ type: "BROWSER_SET_VIEWPORT", payload: preset });
    try {
      await qaViewport({ preset });
    } catch {
      // viewport will be applied on next capture
    }
  }, []);

  const toggleFullPage = useCallback(() => {
    dispatch({ type: "BROWSER_TOGGLE_FULLPAGE" });
  }, []);

  const captureScreenshot = useCallback(async () => {
    dispatch({ type: "BROWSER_SCREENSHOT_START" });
    try {
      const result = await qaScreenshot({ fullPage: state.browser.fullPage });
      if (isActionError(result)) {
        dispatch({ type: "BROWSER_SCREENSHOT_ERROR", payload: result.error });
        return;
      }
      dispatch({ type: "BROWSER_SCREENSHOT_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Screenshot failed";
      dispatch({ type: "BROWSER_SCREENSHOT_ERROR", payload: message });
    }
  }, [state.browser.fullPage]);

  const fetchNetwork = useCallback(async (includeStatic = false) => {
    dispatch({ type: "BROWSER_NETWORK_START" });
    try {
      const result = await qaNetwork(includeStatic);
      if (isActionError(result)) {
        dispatch({ type: "BROWSER_NETWORK_ERROR", payload: result.error });
        return;
      }
      dispatch({ type: "BROWSER_NETWORK_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : "Network fetch failed";
      dispatch({ type: "BROWSER_NETWORK_ERROR", payload: message });
    }
  }, []);

  const setConsoleLevel = useCallback(
    (level: "error" | "warning" | "info" | "debug") => {
      dispatch({ type: "BROWSER_SET_CONSOLE_LEVEL", payload: level });
    },
    [],
  );

  const fetchConsole = useCallback(async (level?: string) => {
    dispatch({ type: "BROWSER_CONSOLE_START" });
    try {
      const result = await qaConsole(level ?? state.browser.consoleLevel);
      if (isActionError(result)) {
        dispatch({ type: "BROWSER_CONSOLE_ERROR", payload: result.error });
        return;
      }
      dispatch({ type: "BROWSER_CONSOLE_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : "Console fetch failed";
      dispatch({ type: "BROWSER_CONSOLE_ERROR", payload: message });
    }
  }, [state.browser.consoleLevel]);

  // ── Test Runner Actions ─────────────────────────────────────────
  const setTestTarget = useCallback((target: string) => {
    dispatch({ type: "TEST_SET_TARGET", payload: target });
  }, []);

  const runTests = useCallback(async () => {
    if (!state.testRunner.target.trim()) return;
    dispatch({ type: "TEST_RUN_START" });
    try {
      const result = await qaTestRun(state.testRunner.target);
      dispatch({ type: "TEST_RUN_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Test run failed";
      dispatch({ type: "TEST_RUN_ERROR", payload: message });
    }
  }, [state.testRunner.target]);

  // ── Coverage Actions ────────────────────────────────────────────
  const setCoverageTarget = useCallback((target: string) => {
    dispatch({ type: "COVERAGE_SET_TARGET", payload: target });
  }, []);

  const analyzeCoverage = useCallback(async () => {
    if (!state.coverage.target.trim()) return;
    dispatch({ type: "COVERAGE_RUN_START" });
    try {
      const result = await qaCoverage(state.coverage.target);
      dispatch({ type: "COVERAGE_RUN_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : "Coverage analysis failed";
      dispatch({ type: "COVERAGE_RUN_ERROR", payload: message });
    }
  }, [state.coverage.target]);

  // ── A11y Actions ────────────────────────────────────────────────
  const setA11yStandard = useCallback(
    (standard: "wcag2a" | "wcag2aa" | "wcag21aa") => {
      dispatch({ type: "A11Y_SET_STANDARD", payload: standard });
    },
    [],
  );

  const runA11yScan = useCallback(async () => {
    dispatch({ type: "A11Y_SCAN_START" });
    try {
      const result = await qaAccessibility(state.a11y.standard);
      if (isActionError(result)) {
        dispatch({ type: "A11Y_SCAN_ERROR", payload: result.error });
        return;
      }
      dispatch({ type: "A11Y_SCAN_SUCCESS", payload: result });
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : "Accessibility scan failed";
      dispatch({ type: "A11Y_SCAN_ERROR", payload: message });
    }
  }, [state.a11y.standard]);

  return {
    state,
    // Browser
    setUrl,
    navigate,
    setViewport,
    toggleFullPage,
    captureScreenshot,
    fetchNetwork,
    setConsoleLevel,
    fetchConsole,
    // Test runner
    setTestTarget,
    runTests,
    // Coverage
    setCoverageTarget,
    analyzeCoverage,
    // A11y
    setA11yStandard,
    runA11yScan,
  };
}
