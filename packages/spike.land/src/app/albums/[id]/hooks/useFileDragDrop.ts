"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Options for useFileDragDrop hook
 */
export interface UseFileDragDropOptions {
  /**
   * Whether file drag-drop is enabled
   */
  enabled?: boolean;
  /**
   * Callback when files are dropped
   */
  onFileDrop?: (files: File[]) => void;
}

/**
 * Return type for useFileDragDrop hook
 */
export interface UseFileDragDropReturn {
  // State
  isDraggingFiles: boolean;

  // Handlers
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // File input helpers
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadClick: () => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Reset
  resetDragState: () => void;
}

/**
 * Hook for managing file drag-and-drop state
 *
 * @param options - Configuration options
 * @returns Drag state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   isDraggingFiles,
 *   handleDragEnter,
 *   handleDragLeave,
 *   handleDragOver,
 *   handleDrop,
 *   fileInputRef,
 *   handleUploadClick,
 *   handleFileInputChange,
 * } = useFileDragDrop({
 *   enabled: isOwner,
 *   onFileDrop: (files) => uploadFiles(files),
 * });
 *
 * <div
 *   onDragEnter={handleDragEnter}
 *   onDragLeave={handleDragLeave}
 *   onDragOver={handleDragOver}
 *   onDrop={handleDrop}
 * >
 *   {isDraggingFiles && <DropOverlay />}
 *   <input
 *     ref={fileInputRef}
 *     type="file"
 *     onChange={handleFileInputChange}
 *     hidden
 *   />
 *   <Button onClick={handleUploadClick}>Upload</Button>
 * </div>
 * ```
 */
export function useFileDragDrop(
  options: UseFileDragDropOptions = {},
): UseFileDragDropReturn {
  const { enabled = true, onFileDrop } = options;

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;

      if (e.dataTransfer.types.includes("Files")) {
        setIsDraggingFiles(true);
      }
    },
    [enabled],
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;

      if (dragCounterRef.current === 0) {
        setIsDraggingFiles(false);
      }
    },
    [enabled],
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();
    },
    [enabled],
  );

  /**
   * Handle file drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFiles(false);
      dragCounterRef.current = 0;

      if (!e.dataTransfer?.files) {
        return;
      }

      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));

      if (files.length > 0) {
        onFileDrop?.(files);
      }
    },
    [enabled, onFileDrop],
  );

  /**
   * Handle upload button click
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        onFileDrop?.(files);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onFileDrop],
  );

  /**
   * Reset drag state
   */
  const resetDragState = useCallback(() => {
    setIsDraggingFiles(false);
    dragCounterRef.current = 0;
  }, []);

  return {
    isDraggingFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    fileInputRef,
    handleUploadClick,
    handleFileInputChange,
    resetDragState,
  };
}
