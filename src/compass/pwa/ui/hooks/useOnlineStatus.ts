import { useEffect, useState } from "react";

interface UseOnlineStatusReturn {
  isOnline: boolean;
  /** ISO timestamp of the last connectivity change */
  lastChangedAt: string | null;
}

/**
 * Tracks navigator.onLine and responds to browser online/offline events.
 *
 * Design notes:
 * - Initialises from navigator.onLine so SSR-hydration safe (defaults true
 *   in environments where navigator is undefined).
 * - Each connectivity change records a timestamp so consumers can display
 *   "offline since HH:MM" messages.
 * - Cleans up event listeners on unmount.
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);

  useEffect(() => {
    function handleOnline(): void {
      setIsOnline(true);
      setLastChangedAt(new Date().toISOString());
    }

    function handleOffline(): void {
      setIsOnline(false);
      setLastChangedAt(new Date().toISOString());
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return (): void => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastChangedAt };
}
