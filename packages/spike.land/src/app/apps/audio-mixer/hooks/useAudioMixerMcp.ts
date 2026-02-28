"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";

/**
 * MCP-only hook for audio mixer project and track operations.
 * Wraps useMcpTool (queries) and useMcpMutation (mutations) with no direct
 * Prisma or fetch calls.
 */
export function useAudioMixerMcp(activeProjectId: string | null) {
  const projectsQuery = useMcpTool<string>(
    "audio_list_projects",
    {},
    { enabled: true, refetchInterval: 30_000 },
  );

  const tracksQuery = useMcpTool<string>(
    "audio_list_tracks",
    { project_id: activeProjectId },
    { enabled: !!activeProjectId, refetchInterval: 10_000 },
  );

  const createProjectMut = useMcpMutation<string>("audio_create_project", {
    onSuccess: () => projectsQuery.refetch(),
  });

  const deleteProjectMut = useMcpMutation<string>("audio_delete_project", {
    onSuccess: () => projectsQuery.refetch(),
  });

  const deleteTrackMut = useMcpMutation<string>("audio_delete_track", {
    onSuccess: () => tracksQuery.refetch(),
  });

  const updateTrackMut = useMcpMutation<string>("audio_update_track", {
    onSuccess: () => tracksQuery.refetch(),
  });

  return {
    projectsQuery,
    tracksQuery,
    createProjectMut,
    deleteProjectMut,
    deleteTrackMut,
    updateTrackMut,
  };
}
