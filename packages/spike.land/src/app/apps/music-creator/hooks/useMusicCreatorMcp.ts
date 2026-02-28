"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useMcpStream } from "@/lib/mcp/client/hooks/use-mcp-stream";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";

/**
 * MCP-only hook for music creator project, track, and playback operations.
 * Wraps useMcpTool (queries), useMcpMutation (mutations), and useMcpStream
 * (AI generation) with no direct Prisma or fetch calls.
 */
export function useMusicCreatorMcp(activeProjectId: string | null) {
  // ─── Queries ───────────────────────────────────────────────────────────────

  const projectsQuery = useMcpTool<string>(
    "music_list_projects",
    {},
    { enabled: true, refetchInterval: 30_000 },
  );

  const tracksQuery = useMcpTool<string>(
    "music_list_tracks",
    { project_id: activeProjectId },
    { enabled: !!activeProjectId, refetchInterval: 10_000 },
  );

  // ─── Project Mutations ─────────────────────────────────────────────────────

  const createProjectMut = useMcpMutation<string>("music_create_project", {
    onSuccess: () => projectsQuery.refetch(),
  });

  const deleteProjectMut = useMcpMutation<string>("music_delete_project", {
    onSuccess: () => projectsQuery.refetch(),
  });

  const saveProjectMut = useMcpMutation<string>("music_save_project", {
    onSuccess: () => projectsQuery.refetch(),
  });

  const exportProjectMut = useMcpMutation<string>("music_export_project");

  // ─── Track Mutations ───────────────────────────────────────────────────────

  const addTrackMut = useMcpMutation<string>("music_add_track", {
    onSuccess: () => tracksQuery.refetch(),
  });

  const removeTrackMut = useMcpMutation<string>("music_remove_track", {
    onSuccess: () => tracksQuery.refetch(),
  });

  const reorderTracksMut = useMcpMutation<string>("music_reorder_tracks", {
    onSuccess: () => tracksQuery.refetch(),
  });

  const updateTrackMut = useMcpMutation<string>("music_update_track", {
    onSuccess: () => tracksQuery.refetch(),
  });

  const selectInstrumentMut = useMcpMutation<string>(
    "music_select_instrument",
    { onSuccess: () => tracksQuery.refetch() },
  );

  // ─── Playback Mutations ────────────────────────────────────────────────────

  const playMut = useMcpMutation<string>("music_playback_play");
  const stopMut = useMcpMutation<string>("music_playback_stop");
  const pauseMut = useMcpMutation<string>("music_playback_pause");

  // ─── AI Generation Stream ─────────────────────────────────────────────────

  const aiGenerateStream = useMcpStream("music_ai_generate");

  return {
    // Queries
    projectsQuery,
    tracksQuery,
    // Project mutations
    createProjectMut,
    deleteProjectMut,
    saveProjectMut,
    exportProjectMut,
    // Track mutations
    addTrackMut,
    removeTrackMut,
    reorderTracksMut,
    updateTrackMut,
    selectInstrumentMut,
    // Playback mutations
    playMut,
    stopMut,
    pauseMut,
    // AI generation stream
    aiGenerateStream,
  };
}
