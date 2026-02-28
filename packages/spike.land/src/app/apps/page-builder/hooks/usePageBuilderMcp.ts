"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

export function usePageBuilderMcp() {
  // Page Queries & Mutations
  const createPage = useMcpMutation("create_page");
  const updatePage = useMcpMutation("update_page");
  const publishPage = useMcpMutation("publish_page");

  // Block Mutations
  const addBlock = useMcpMutation("add_block");
  const updateBlock = useMcpMutation("update_block");
  const reorderBlocks = useMcpMutation("reorder_blocks");

  // AI Mutations
  const aiGeneratePage = useMcpMutation("ai_generate_page");
  const aiEnhanceBlock = useMcpMutation("ai_enhance_block");
  const aiCreateTheme = useMcpMutation("ai_create_theme");

  return {
    mutations: {
      createPage,
      updatePage,
      publishPage,
      addBlock,
      updateBlock,
      reorderBlocks,
      aiGeneratePage,
      aiEnhanceBlock,
      aiCreateTheme,
    },
  };
}
