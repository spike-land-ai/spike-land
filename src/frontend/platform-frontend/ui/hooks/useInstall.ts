import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../core-logic/api";

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

interface InstallResponse {
  appName: string;
  count: number;
}

interface UninstallResponse {
  appName: string;
}

interface InstallStatusResponse {
  count: number;
  installed: boolean;
}

interface InstalledApp {
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchInstallStatus(slug: string): Promise<InstallStatusResponse> {
  const res = await apiFetch(`/store/install/${encodeURIComponent(slug)}/status`);
  if (!res.ok) {
    if (res.status === 401) {
      // Not authenticated — return guest state
      return { count: 0, installed: false };
    }
    throw new Error(`Failed to fetch install status for "${slug}"`);
  }
  return res.json() as Promise<InstallStatusResponse>;
}

async function fetchInstalledApps(): Promise<InstalledApp[]> {
  const res = await apiFetch("/store/install/my");
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Failed to fetch installed apps");
  }
  return res.json() as Promise<InstalledApp[]>;
}

async function postInstall(slug: string): Promise<InstallResponse> {
  const res = await apiFetch("/store/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Install failed for "${slug}"`);
  }
  return res.json() as Promise<InstallResponse>;
}

async function deleteInstall(slug: string): Promise<UninstallResponse> {
  const res = await apiFetch(`/store/install/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Uninstall failed for "${slug}"`);
  }
  return res.json() as Promise<UninstallResponse>;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const installKeys = {
  status: (slug: string) => ["store", "install", "status", slug] as const,
  list: () => ["store", "install", "list"] as const,
};

// ---------------------------------------------------------------------------
// useInstallStatus — lightweight per-app status query
// ---------------------------------------------------------------------------

/**
 * Returns the install status and total install count for a single app.
 * Silently returns `{ installed: false, count: 0 }` when the user is not
 * authenticated, so the store renders correctly for anonymous visitors.
 */
export function useInstallStatus(slug: string) {
  return useQuery({
    queryKey: installKeys.status(slug),
    queryFn: () => fetchInstallStatus(slug),
    // Treat auth errors as graceful non-installed state
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) return false;
      return failureCount < 2;
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// useInstalledApps — list of all apps the user has installed
// ---------------------------------------------------------------------------

/**
 * Returns the full list of apps installed by the current user.
 * Returns an empty array for unauthenticated visitors.
 */
export function useInstalledApps() {
  return useQuery({
    queryKey: installKeys.list(),
    queryFn: fetchInstalledApps,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) return false;
      return failureCount < 2;
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// useInstall — install + uninstall mutations for a single app
// ---------------------------------------------------------------------------

export interface UseInstallReturn {
  /** Whether this app is currently installed for the authenticated user. */
  isInstalled: boolean;
  /** Total platform-wide install count for this app. */
  installCount: number;
  /** True while status is being fetched for the first time. */
  isStatusLoading: boolean;
  /** True while an install mutation is in-flight. */
  isInstalling: boolean;
  /** True while an uninstall mutation is in-flight. */
  isUninstalling: boolean;
  /** Install the app. Resolves when the server confirms. */
  install: () => Promise<void>;
  /** Uninstall the app. Resolves when the server confirms. */
  uninstall: () => Promise<void>;
  /** The last error from either mutation, if any. */
  mutationError: Error | null;
}

/**
 * Manages install/uninstall state for a single app slug.
 *
 * Applies optimistic updates to the per-app status cache so the button
 * flips immediately, then reconciles with the server response.
 */
export function useInstall(slug: string): UseInstallReturn {
  const queryClient = useQueryClient();
  const statusQuery = useInstallStatus(slug);

  const isInstalled = statusQuery.data?.installed ?? false;
  const installCount = statusQuery.data?.count ?? 0;

  const installMutation = useMutation({
    mutationFn: () => postInstall(slug),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: installKeys.status(slug) });
      const previous = queryClient.getQueryData<InstallStatusResponse>(installKeys.status(slug));
      // Optimistic update
      queryClient.setQueryData<InstallStatusResponse>(installKeys.status(slug), (old) => ({
        installed: true,
        count: (old?.count ?? 0) + 1,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(installKeys.status(slug), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<InstallStatusResponse>(installKeys.status(slug), (old) => ({
        installed: true,
        count: data.count ?? old?.count ?? 0,
      }));
      void queryClient.invalidateQueries({ queryKey: installKeys.list() });
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: () => deleteInstall(slug),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: installKeys.status(slug) });
      const previous = queryClient.getQueryData<InstallStatusResponse>(installKeys.status(slug));
      queryClient.setQueryData<InstallStatusResponse>(installKeys.status(slug), (old) => ({
        installed: false,
        count: Math.max(0, (old?.count ?? 1) - 1),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(installKeys.status(slug), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: installKeys.status(slug) });
      void queryClient.invalidateQueries({ queryKey: installKeys.list() });
    },
  });

  const mutationError =
    (installMutation.error instanceof Error ? installMutation.error : null) ??
    (uninstallMutation.error instanceof Error ? uninstallMutation.error : null);

  return {
    isInstalled,
    installCount,
    isStatusLoading: statusQuery.isLoading,
    isInstalling: installMutation.isPending,
    isUninstalling: uninstallMutation.isPending,
    install: async () => {
      await installMutation.mutateAsync();
    },
    uninstall: async () => {
      await uninstallMutation.mutateAsync();
    },
    mutationError,
  };
}
