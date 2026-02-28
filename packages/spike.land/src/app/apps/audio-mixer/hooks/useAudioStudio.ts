"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";
import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useMcpUpload } from "@/lib/mcp/client/hooks/use-mcp-upload";
import { useMcpStream } from "@/lib/mcp/client/hooks/use-mcp-stream";

/* ── Types ──────────────────────────────────────────────────────────── */

export interface AudioProject {
  id: string;
  name: string;
  trackCount: number;
  updatedAt: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  fileFormat: string;
  duration: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  sortOrder: number;
}

export type PlaybackState = "stopped" | "playing" | "paused";

/* ── Hook ───────────────────────────────────────────────────────────── */

export function useAudioStudio() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentTime, setCurrentTime] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const playbackRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  /* ─── MCP Queries (useMcpTool) ─────────────────────────────────── */

  const projects = useMcpTool<string>("audio_list_projects", {}, {
    enabled: true,
    refetchInterval: 30_000,
  });

  const tracks = useMcpTool<string>("audio_list_tracks", {
    project_id: activeProjectId,
  }, {
    enabled: !!activeProjectId,
    refetchInterval: 10_000,
  });

  /* ─── MCP Mutations (useMcpMutation) ───────────────────────────── */

  const createProject = useMcpMutation<string>("audio_create_project", {
    onSuccess: () => projects.refetch(),
  });

  const deleteProject = useMcpMutation<string>("audio_delete_project", {
    onSuccess: () => {
      setActiveProjectId(null);
      projects.refetch();
    },
  });

  const deleteTrack = useMcpMutation<string>("audio_delete_track", {
    onSuccess: () => tracks.refetch(),
  });

  const updateTrack = useMcpMutation<string>("audio_update_track", {
    onSuccess: () => tracks.refetch(),
  });

  /* ─── MCP Upload (useMcpUpload) ────────────────────────────────── */

  const uploader = useMcpUpload("audio", {
    onSuccess: () => tracks.refetch(),
  });

  /* ─── MCP Stream (useMcpStream) ─────────────────────────────────── */

  const ttsStream = useMcpStream("generate_speech", {
    onDone: () => tracks.refetch(),
  });

  /* ─── Local Playback (Web Audio API simulation) ────────────────── */

  const play = useCallback(() => {
    setPlaybackState("playing");
    startTimeRef.current = Date.now() - currentTime * 1000;
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setCurrentTime(elapsed);
      playbackRef.current = requestAnimationFrame(tick);
    };
    playbackRef.current = requestAnimationFrame(tick);
  }, [currentTime]);

  const pause = useCallback(() => {
    setPlaybackState("paused");
    if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
  }, []);

  const stop = useCallback(() => {
    setPlaybackState("stopped");
    setCurrentTime(0);
    if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
  }, []);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    if (playbackState === "playing") {
      startTimeRef.current = Date.now() - time * 1000;
    }
  }, [playbackState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
    };
  }, []);

  /* ─── Actions ──────────────────────────────────────────────────── */

  const handleCreateProject = useCallback(async (name: string) => {
    await createProject.mutate({ name });
  }, [createProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await deleteProject.mutate({ project_id: projectId });
  }, [deleteProject]);

  const handleUploadTrack = useCallback(async (file: File) => {
    if (!activeProjectId) return;
    await uploader.upload(file, { project_id: activeProjectId });
  }, [activeProjectId, uploader]);

  const handleDeleteTrack = useCallback(async (trackId: string) => {
    await deleteTrack.mutate({ track_id: trackId });
  }, [deleteTrack]);

  const handleUpdateTrack = useCallback(
    async (
      trackId: string,
      updates: Partial<Pick<AudioTrack, "name" | "volume" | "muted" | "solo">>,
    ) => {
      await updateTrack.mutate({ track_id: trackId, ...updates });
    },
    [updateTrack],
  );

  const handleGenerateSpeech = useCallback(
    async (text: string, voice: string) => {
      await ttsStream.start({ text, voice, project_id: activeProjectId });
    },
    [ttsStream, activeProjectId],
  );

  return {
    // Project state
    activeProjectId,
    setActiveProjectId,
    projects,
    createProject: handleCreateProject,
    deleteProject: handleDeleteProject,
    isCreatingProject: createProject.isLoading,
    isDeletingProject: deleteProject.isLoading,

    // Track state
    tracks,
    uploadTrack: handleUploadTrack,
    deleteTrack: handleDeleteTrack,
    updateTrack: handleUpdateTrack,
    uploadProgress: uploader.progress,
    isUploading: uploader.isLoading,
    isDeletingTrack: deleteTrack.isLoading,
    isUpdatingTrack: updateTrack.isLoading,

    // Playback
    playbackState,
    currentTime,
    masterVolume,
    setMasterVolume,
    play,
    pause,
    stop,
    seek,

    // TTS
    ttsStream,
    generateSpeech: handleGenerateSpeech,
  };
}
