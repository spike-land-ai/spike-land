"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseAutoResizeTextareaOptions {
  minHeight?: number;
  maxHeight?: number;
}

interface UseAutoResizeTextareaReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  resize: () => void;
}

/**
 * Hook that manages textarea height based on content.
 * Clamps height between minHeight and maxHeight, toggling overflow as needed.
 */
export function useAutoResizeTextarea(
  options?: UseAutoResizeTextareaOptions,
): UseAutoResizeTextareaReturn {
  const { minHeight = 84, maxHeight = 224 } = options ?? {};
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const clamped = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${clamped}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minHeight, maxHeight]);

  useEffect(() => {
    resize();
  }, [resize]);

  return { textareaRef, resize };
}
