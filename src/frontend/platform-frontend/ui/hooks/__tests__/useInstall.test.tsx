import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInstall, useInstalledApps, useInstallStatus } from "../useInstall";

// ---------------------------------------------------------------------------
// Mock api module
// ---------------------------------------------------------------------------

vi.mock("../../../core-logic/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "../../../core-logic/api";

const mockApiFetch = vi.mocked(apiFetch);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// useInstallStatus
// ---------------------------------------------------------------------------

describe("useInstallStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns installed status from the API", async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse({ installed: true, count: 42 }));

    const { result } = renderHook(() => useInstallStatus("qa-studio"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ installed: true, count: 42 });
    expect(mockApiFetch).toHaveBeenCalledWith("/store/install/qa-studio/status");
  });

  it("returns guest state when unauthenticated (401)", async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse({}, 401));

    const { result } = renderHook(() => useInstallStatus("qa-studio"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ installed: false, count: 0 });
  });
});

// ---------------------------------------------------------------------------
// useInstalledApps
// ---------------------------------------------------------------------------

describe("useInstalledApps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user's installed apps list", async () => {
    const apps = [
      { name: "QA Studio", slug: "qa-studio" },
      { name: "Chess Arena", slug: "chess-arena" },
    ];
    mockApiFetch.mockResolvedValueOnce(mockResponse(apps));

    const { result } = renderHook(() => useInstalledApps(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.slug).toBe("qa-studio");
  });

  it("returns empty array for unauthenticated users", async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse({}, 401));

    const { result } = renderHook(() => useInstalledApps(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// useInstall
// ---------------------------------------------------------------------------

describe("useInstall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes isInstalled and installCount from status query", async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse({ installed: false, count: 7 }));

    const { result } = renderHook(() => useInstall("qa-studio"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isStatusLoading).toBe(false));

    expect(result.current.isInstalled).toBe(false);
    expect(result.current.installCount).toBe(7);
  });

  it("optimistically updates install state and reconciles with server response", async () => {
    // Initial status fetch
    mockApiFetch.mockResolvedValueOnce(mockResponse({ installed: false, count: 10 }));
    // Install POST
    mockApiFetch.mockResolvedValueOnce(mockResponse({ appName: "QA Studio", count: 11 }));

    const { result } = renderHook(() => useInstall("qa-studio"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isStatusLoading).toBe(false));
    expect(result.current.isInstalled).toBe(false);

    await act(async () => {
      await result.current.install();
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.installCount).toBe(11);
  });

  it("optimistically updates uninstall state", async () => {
    // Initial status fetch: already installed
    mockApiFetch.mockResolvedValueOnce(mockResponse({ installed: true, count: 5 }));
    // Uninstall DELETE
    mockApiFetch.mockResolvedValueOnce(mockResponse({ appName: "QA Studio" }));
    // Re-fetch after invalidation
    mockApiFetch.mockResolvedValueOnce(mockResponse({ installed: false, count: 4 }));

    const { result } = renderHook(() => useInstall("qa-studio"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isInstalled).toBe(true));

    await act(async () => {
      await result.current.uninstall();
    });

    // After the delete + re-fetch, should be uninstalled
    await waitFor(() => expect(result.current.isInstalled).toBe(false));
  });

  it("rolls back optimistic install update on server error", async () => {
    // Initial status
    mockApiFetch.mockResolvedValueOnce(mockResponse({ installed: false, count: 3 }));
    // Install POST fails
    mockApiFetch.mockResolvedValueOnce(mockResponse({ error: "Unauthorized" }, 401));

    const { result } = renderHook(() => useInstall("qa-studio"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isStatusLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.install();
      } catch {
        // expected
      }
    });

    // Should have rolled back to previous state
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.installCount).toBe(3);
  });
});
