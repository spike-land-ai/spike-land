"use client";

import { tryCatch } from "@/lib/try-catch";
import { useCallback, useState } from "react";
import type { AlbumListItem } from "./types";

/**
 * Options for useMoveToAlbum hook
 */
export interface UseMoveToAlbumOptions {
  /**
   * Current album ID (to exclude from target list)
   */
  currentAlbumId: string;
  /**
   * Callback when move completes successfully
   */
  onMoveComplete?: (movedImageIds: string[], targetAlbumId: string) => void;
  /**
   * Callback on move error
   */
  onMoveError?: (error: Error) => void;
}

/**
 * Return type for useMoveToAlbum hook
 */
export interface UseMoveToAlbumReturn {
  // Dialog state
  showMoveDialog: boolean;
  setShowMoveDialog: (show: boolean) => void;

  // Albums list
  allAlbums: AlbumListItem[];
  isLoadingAlbums: boolean;

  // Selection
  selectedTargetAlbum: string;
  setSelectedTargetAlbum: (albumId: string) => void;

  // Move operation
  isMoving: boolean;

  // Actions
  openMoveDialog: (selectedImageIds: Set<string>) => void;
  handleMoveImages: (selectedImageIds: Set<string>) => Promise<void>;
  closeMoveDialog: () => void;
}

/**
 * Hook for managing move to album dialog and operations
 *
 * @param options - Configuration options
 * @returns Move dialog state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   showMoveDialog,
 *   allAlbums,
 *   isLoadingAlbums,
 *   selectedTargetAlbum,
 *   setSelectedTargetAlbum,
 *   isMoving,
 *   openMoveDialog,
 *   handleMoveImages,
 *   closeMoveDialog,
 * } = useMoveToAlbum({
 *   currentAlbumId: albumId,
 *   onMoveComplete: (imageIds, targetId) => {
 *     // Update local state to remove moved images
 *   },
 * });
 *
 * // Open dialog with selected images
 * <Button onClick={() => openMoveDialog(selectedImages)}>Move</Button>
 *
 * // In dialog
 * <Button onClick={() => handleMoveImages(selectedImages)}>Confirm Move</Button>
 * ```
 */
export function useMoveToAlbum(
  options: UseMoveToAlbumOptions,
): UseMoveToAlbumReturn {
  const { currentAlbumId, onMoveComplete, onMoveError } = options;

  // Dialog state
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // Albums list state
  const [allAlbums, setAllAlbums] = useState<AlbumListItem[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);

  // Selection state
  const [selectedTargetAlbum, setSelectedTargetAlbum] = useState<string>("");

  // Move operation state
  const [isMoving, setIsMoving] = useState(false);

  /**
   * Fetch all albums (excluding current)
   */
  const fetchAllAlbums = useCallback(async () => {
    setIsLoadingAlbums(true);

    const { data: response, error: fetchError } = await tryCatch(
      fetch("/api/albums"),
    );

    if (fetchError || !response.ok) {
      setIsLoadingAlbums(false);
      return;
    }

    const { data, error: jsonError } = await tryCatch(
      response.json() as Promise<{ albums: AlbumListItem[]; }>,
    );

    if (jsonError) {
      setIsLoadingAlbums(false);
      return;
    }

    setAllAlbums(
      data.albums
        .filter((a: AlbumListItem) => a.id !== currentAlbumId)
        .map((a: AlbumListItem) => ({
          id: a.id,
          name: a.name,
          imageCount: a.imageCount,
        })),
    );
    setIsLoadingAlbums(false);
  }, [currentAlbumId]);

  /**
   * Open move dialog and fetch albums
   */
  const openMoveDialog = useCallback(
    (selectedImageIds: Set<string>) => {
      if (selectedImageIds.size === 0) return;
      setShowMoveDialog(true);
      setSelectedTargetAlbum("");
      fetchAllAlbums();
    },
    [fetchAllAlbums],
  );

  /**
   * Close move dialog
   */
  const closeMoveDialog = useCallback(() => {
    setShowMoveDialog(false);
    setSelectedTargetAlbum("");
  }, []);

  /**
   * Move selected images to target album
   */
  const handleMoveImages = useCallback(
    async (selectedImageIds: Set<string>) => {
      if (!selectedTargetAlbum || selectedImageIds.size === 0) return;

      setIsMoving(true);
      const imageIds = Array.from(selectedImageIds);

      // First add images to the target album
      const { error: addError } = await tryCatch(
        fetch(`/api/albums/${selectedTargetAlbum}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageIds }),
        }),
      );

      if (addError) {
        onMoveError?.(
          addError instanceof Error
            ? addError
            : new Error("Failed to add images to target album"),
        );
        setIsMoving(false);
        return;
      }

      // Then remove from current album
      const { error: removeError } = await tryCatch(
        fetch(`/api/albums/${currentAlbumId}/images`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageIds }),
        }),
      );

      if (removeError) {
        onMoveError?.(
          removeError instanceof Error
            ? removeError
            : new Error("Failed to remove images from current album"),
        );
        setIsMoving(false);
        return;
      }

      setShowMoveDialog(false);
      onMoveComplete?.(imageIds, selectedTargetAlbum);
      setIsMoving(false);
    },
    [selectedTargetAlbum, currentAlbumId, onMoveComplete, onMoveError],
  );

  return {
    showMoveDialog,
    setShowMoveDialog,
    allAlbums,
    isLoadingAlbums,
    selectedTargetAlbum,
    setSelectedTargetAlbum,
    isMoving,
    openMoveDialog,
    handleMoveImages,
    closeMoveDialog,
  };
}
