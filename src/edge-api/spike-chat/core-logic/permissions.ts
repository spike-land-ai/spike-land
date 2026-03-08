import { eq, and } from "drizzle-orm";
import { createDb } from "../db/db-index";
import { channels, channelMembers } from "../db/schema";
import type { Env } from "./env";

export async function checkWorkspaceMembership(
  env: Env,
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  // Visitors are handled separately at the channel level depending on guestAccess settings
  if (userId.startsWith("visitor-")) {
    return true;
  }

  try {
    const res = await env.MCP_SERVICE.fetch(
      new Request(`https://mcp.spike.land/internal/workspaces/${workspaceId}/members/${userId}`),
    );

    if (res.status === 404) {
      return false; // Not a member
    }

    return res.ok;
  } catch (error) {
    console.error("Error checking workspace membership:", error);
    // Fail closed
    return false;
  }
}

/**
 * Check if a user has access to a specific channel.
 * - For public channels: check workspace membership (visitors allowed)
 * - For private channels: check channel_members table
 * - For DMs: check channel_members table (visitor- prefix always denied)
 * - Channel not found: deny
 */
export async function checkChannelAccess(
  env: Env,
  userId: string,
  channelId: string,
): Promise<boolean> {
  try {
    const db = createDb(env.DB);

    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      return false;
    }

    if (channel.type === "public") {
      // Visitors can access public channels; non-visitors must be workspace members
      if (userId.startsWith("visitor-")) {
        return true;
      }
      return checkWorkspaceMembership(env, userId, channel.workspaceId);
    }

    // private and dm: visitors are never allowed; check channel_members
    if (userId.startsWith("visitor-")) {
      return false;
    }

    const [membership] = await db
      .select()
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
      .limit(1);

    return membership !== undefined;
  } catch (error) {
    console.error("Error checking channel access:", error);
    // Fail closed
    return false;
  }
}
