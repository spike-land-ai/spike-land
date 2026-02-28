import { useEffect, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import { createGameDocument } from "../lib/crdt/game-document";
import { isE2EMode } from "../lib/e2e-utils";

export function useYjsSync(roomId: string) {
  const [doc] = useState(() => createGameDocument());
  // In E2E mode, immediately mark as synced to bypass IndexedDB persistence
  const [isSynced, setIsSynced] = useState(isE2EMode());

  useEffect(() => {
    if (!roomId) return;

    // In E2E mode, skip IndexedDB persistence entirely
    // This avoids timeouts waiting for sync events that never fire
    if (isE2EMode()) {
      setIsSynced(true);
      return;
    }

    const persistence = new IndexeddbPersistence(roomId, doc);

    persistence.on("synced", () => {
      setIsSynced(true);
    });

    return () => {
      persistence.destroy();
    };
  }, [doc, roomId]);

  return { doc, isSynced };
}
