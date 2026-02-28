"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";

export interface StateMachineListResult {
  text: string;
}

export interface StateMachineExportResult {
  text: string;
}

/**
 * MCP hook for state machine operations.
 * Provides typed wrappers around MCP tools using useMcpMutation and useMcpTool.
 *
 * For the full orchestration hook (tabs, active machine, loading state),
 * use useStateMachine from @/components/state-machine/use-state-machine.
 */
export function useStateMachineMcp() {
  // ── Queries ──────────────────────────────────────────────────────────────

  const listQuery = useMcpTool<string>("sm_list", {}, { enabled: false });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMut = useMcpMutation<string>("sm_create");
  const addStateMut = useMcpMutation<string>("sm_add_state");
  const removeStateMut = useMcpMutation<string>("sm_remove_state");
  const addTransitionMut = useMcpMutation<string>("sm_add_transition");
  const removeTransitionMut = useMcpMutation<string>("sm_remove_transition");
  const sendEventMut = useMcpMutation<string>("sm_send_event");
  const resetMut = useMcpMutation<string>("sm_reset");
  const validateMut = useMcpMutation<string>("sm_validate");
  const exportMut = useMcpMutation<string>("sm_export");
  const shareMut = useMcpMutation<string>("sm_share");
  const setContextMut = useMcpMutation<string>("sm_set_context");
  const getStateMut = useMcpMutation<string>("sm_get_state");
  const getHistoryMut = useMcpMutation<string>("sm_get_history");

  // AI generation via chat tool
  const chatMut = useMcpMutation<string>("chat_send_message");

  return {
    // Query
    listQuery,

    // Mutations
    createMut,
    addStateMut,
    removeStateMut,
    addTransitionMut,
    removeTransitionMut,
    sendEventMut,
    resetMut,
    validateMut,
    exportMut,
    shareMut,
    setContextMut,
    getStateMut,
    getHistoryMut,
    chatMut,
  };
}
