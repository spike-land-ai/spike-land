/**
 * E2E Test Utilities
 *
 * Helper functions for detecting and handling E2E test mode.
 * In E2E mode, we bypass certain real-time features (Yjs, WebRTC)
 * that require external services and would cause timeouts in tests.
 */

/**
 * Check if we're running in E2E test mode.
 * E2E mode is enabled via the `?e2e=true` URL parameter.
 *
 * @returns true if running in E2E mode, false otherwise
 */
export function isE2EMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("e2e") === "true";
}
