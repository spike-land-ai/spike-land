/**
 * iwd_campaign_kit + iwd_campaign_avatar
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool, jsonResult } from "@spike-land-ai/mcp-server-base";
import type { ToolClient } from "../mcp/types.js";
import { bannerPrompt, spotlightPrompt, IWD_BRAND } from "../mcp/types.js";

export function registerCampaignTools(server: McpServer, client: ToolClient): void {
  createZodTool(server, {
    name: "iwd_campaign_kit",
    description:
      "Generate a complete IWD social media kit in one call: banner, spotlight card, and avatar. All three images are generated in parallel.",
    schema: {
      name: z.string().describe("Name of the person to spotlight"),
      role: z.string().describe("Their role or title"),
      achievement: z.string().describe("Key achievement"),
      campaign_title: z.string().default("Women in Tech 2026").describe("Campaign title for the banner"),
    },
    async handler({ name, role, achievement, campaign_title }) {
      const [banner, card, avatar] = await Promise.all([
        client.callTool("img_banner", {
          prompt: bannerPrompt(campaign_title),
        }),
        client.callTool("img_generate", {
          prompt: spotlightPrompt(name, role, achievement),
          aspect_ratio: "1:1",
        }),
        client.callTool("img_avatar", {
          prompt: `Professional avatar for ${name}, ${role}. IWD theme with purple (#A020F0) accent. Modern, empowering.`,
        }),
      ]);

      return jsonResult({
        campaign_title,
        spotlight: { name, role, achievement },
        banner: extractContent(banner),
        card: extractContent(card),
        avatar: extractContent(avatar),
        hashtags: IWD_BRAND.hashtags,
      });
    },
  });

  createZodTool(server, {
    name: "iwd_campaign_avatar",
    description: "Generate an IWD-themed profile avatar with purple and green accents.",
    schema: {
      description: z.string().describe("Description of the avatar (e.g. 'software engineer with laptop')"),
      style: z.string().optional().describe("Additional style instructions"),
    },
    async handler({ description, style }) {
      const prompt = [
        description,
        "IWD 2026 themed avatar.",
        `Colors: purple (#A020F0), green (#44B78B).`,
        "Modern, bold, empowering style.",
        style ?? "",
      ].join(" ").trim();

      return client.callTool("img_avatar", { prompt });
    },
  });
}

function extractContent(result: { content: Array<{ text: string }> }): string {
  return result.content[0]?.text ?? "";
}
