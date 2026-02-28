"use client";

import { tryCatch } from "@/lib/try-catch";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Album, AlbumImage, EditFormState } from "./types";

/**
 * Options for useAlbumData hook
 */
export interface UseAlbumDataOptions {
  /**
   * Callback when album is successfully fetched
   */
  onFetchComplete?: (album: Album) => void;
  /**
   * Callback when album is successfully updated
   */
  onUpdateComplete?: (album: Album) => void;
  /**
   * Callback when album is deleted
   */
  onDeleteComplete?: () => void;
  /**
   * Callback on any error
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useAlbumData hook
 */
export interface UseAlbumDataReturn {
  // Data
  album: Album | null;
  isLoading: boolean;
  error: string | null;

  // Edit form
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;

  // Settings dialog
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  isSaving: boolean;

  // Share link
  copied: boolean;
  copyShareLink: () => void;

  // Actions
  fetchAlbum: () => Promise<void>;
  saveSettings: () => Promise<void>;
  deleteAlbum: () => Promise<void>;
  updateLocalAlbum: (updater: (prev: Album | null) => Album | null) => void;

  // Original order ref for reorder rollback
  originalOrderRef: React.RefObject<string[]>;
}

const INITIAL_EDIT_FORM: EditFormState = {
  name: "",
  description: "",
  privacy: "PRIVATE",
  pipelineId: null,
};

/**
 * Hook for managing album data, settings, and CRUD operations
 *
 * @param albumId - The album ID to fetch and manage
 * @param options - Optional callbacks for various events
 * @returns Album data, loading states, and action handlers
 *
 * @example
 * ```tsx
 * const {
 *   album,
 *   isLoading,
 *   error,
 *   showSettings,
 *   setShowSettings,
 *   saveSettings,
 *   deleteAlbum,
 * } = useAlbumData(albumId);
 * ```
 */
export function useAlbumData(
  albumId: string,
  options: UseAlbumDataOptions = {},
): UseAlbumDataReturn {
  const { onFetchComplete, onUpdateComplete, onDeleteComplete, onError } = options;

  // Refs for callbacks (to avoid infinite loops from unstable callback references)
  const onFetchCompleteRef = useRef(onFetchComplete);
  const onUpdateCompleteRef = useRef(onUpdateComplete);
  const onDeleteCompleteRef = useRef(onDeleteComplete);
  const onErrorRef = useRef(onError);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onFetchCompleteRef.current = onFetchComplete;
    onUpdateCompleteRef.current = onUpdateComplete;
    onDeleteCompleteRef.current = onDeleteComplete;
    onErrorRef.current = onError;
  });

  // Core state
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings dialog state
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<EditFormState>(INITIAL_EDIT_FORM);

  // Share link state
  const [copied, setCopied] = useState(false);

  // Ref for tracking original order (for reorder rollback)
  const originalOrderRef = useRef<string[]>([]);

  /**
   * Fetch album data from API
   */
  const fetchAlbum = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: response, error: fetchError } = await tryCatch(
      fetch(`/api/albums/${albumId}`),
    );

    if (fetchError) {
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : "Failed to fetch album";
      setError(errorMessage);
      onErrorRef.current?.(new Error(errorMessage));
      setIsLoading(false);
      return;
    }

    if (response.status === 404) {
      setError("Album not found");
      setIsLoading(false);
      return;
    }

    if (!response.ok) {
      setError("Failed to fetch album");
      onErrorRef.current?.(new Error("Failed to fetch album"));
      setIsLoading(false);
      return;
    }

    const { data, error: jsonError } = await tryCatch(
      response.json() as Promise<{ album: Album; }>,
    );

    if (jsonError) {
      setError("Failed to parse album data");
      onErrorRef.current?.(new Error("Failed to parse album data"));
      setIsLoading(false);
      return;
    }

    setAlbum(data.album);
    setEditForm({
      name: data.album.name,
      description: data.album.description || "",
      privacy: data.album.privacy,
      pipelineId: data.album.pipelineId || null,
    });
    originalOrderRef.current = data.album.images.map((img: AlbumImage) => img.id);
    onFetchCompleteRef.current?.(data.album);
    setIsLoading(false);
  }, [albumId]);

  /**
   * Save album settings
   */
  const saveSettings = useCallback(async () => {
    if (!editForm.name.trim()) return;

    setIsSaving(true);

    const { data: response, error: fetchError } = await tryCatch(
      fetch(`/api/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          privacy: editForm.privacy,
          pipelineId: editForm.pipelineId,
        }),
      }),
    );

    if (fetchError) {
      onErrorRef.current?.(
        fetchError instanceof Error
          ? fetchError
          : new Error("Failed to update album"),
      );
      setIsSaving(false);
      return;
    }

    if (!response.ok) {
      onErrorRef.current?.(new Error("Failed to update album"));
      setIsSaving(false);
      return;
    }

    const { data, error: jsonError } = await tryCatch(
      response.json() as Promise<{ album: Album; }>,
    );

    if (jsonError) {
      onErrorRef.current?.(new Error("Failed to parse response"));
      setIsSaving(false);
      return;
    }

    setAlbum(prev =>
      prev
        ? {
          ...prev,
          name: data.album.name,
          description: data.album.description,
          privacy: data.album.privacy,
          pipelineId: data.album.pipelineId,
          shareToken: data.album.shareToken,
        }
        : null
    );
    setShowSettings(false);
    onUpdateCompleteRef.current?.(data.album);
    setIsSaving(false);
  }, [albumId, editForm]);

  /**
   * Delete the album
   */
  const deleteAlbum = useCallback(async () => {
    const { error: fetchError } = await tryCatch(
      fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      }),
    );

    if (fetchError) {
      onErrorRef.current?.(
        fetchError instanceof Error
          ? fetchError
          : new Error("Failed to delete album"),
      );
      return;
    }

    onDeleteCompleteRef.current?.();
  }, [albumId]);

  /**
   * Copy share link to clipboard
   */
  const copyShareLink = useCallback(() => {
    if (!album?.shareToken) return;

    const url = `${window.location.origin}/albums/${album.id}?token=${album.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [album?.shareToken, album?.id]);

  /**
   * Update local album state (for optimistic updates)
   */
  const updateLocalAlbum = useCallback(
    (updater: (prev: Album | null) => Album | null) => {
      setAlbum(updater);
    },
    [],
  );

  // Fetch album on mount
  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  return {
    // Data
    album,
    isLoading,
    error,

    // Edit form
    editForm,
    setEditForm,

    // Settings dialog
    showSettings,
    setShowSettings,
    isSaving,

    // Share link
    copied,
    copyShareLink,

    // Actions
    fetchAlbum,
    saveSettings,
    deleteAlbum,
    updateLocalAlbum,

    // Refs
    originalOrderRef,
  };
}
