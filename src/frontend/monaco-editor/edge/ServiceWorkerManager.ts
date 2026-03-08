import type { IServiceWorkerManager } from "../core-logic/services/types";

/**
 * Service worker has been removed. This stub unregisters any existing SW
 * so users who had the old one installed get a clean slate.
 */
export const setupServiceWorker = async (): Promise<null> => {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  // Unregister any existing service worker
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));

  // Clean up localStorage artifacts
  localStorage.removeItem("swVersion");

  return null;
};

export class ServiceWorkerManager implements IServiceWorkerManager {
  async setup(): Promise<ServiceWorker | undefined> {
    await setupServiceWorker();
    return undefined;
  }
}
