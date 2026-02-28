"use client";
import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";
import { useMcpTool } from "@/lib/mcp/client/hooks/use-mcp-tool";

export function useSpikeAdminMcp() {
  const usersQuery = useMcpTool<string>("admin_list_users", {});
  const banUserMut = useMcpMutation<string>("admin_ban_user");
  const statsQuery = useMcpTool<string>("admin_get_stats", {});
  return { usersQuery, banUserMut, statsQuery };
}
