import { useEffect, useRef } from "react";
import { useDragDrop } from "../contexts/DragDropContext";

type DropZoneType = "chat" | "gallery" | "canvas";

export function useDropZone(type: DropZoneType) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerZone, unregisterZone, isDragging, activeZone } = useDragDrop();
  const id = useRef(`zone-${type}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (ref.current) {
      registerZone(id.current, type, ref.current);
    }
    return () => unregisterZone(id.current);
  }, [type, registerZone, unregisterZone]);

  return {
    ref,
    isActive: isDragging && activeZone === type,
    isDragging,
  };
}
