/**
 * iwd_amplify_stories + iwd_amplify_comment
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool, jsonResult } from "@spike-land-ai/mcp-server-base";
import type { ToolClient } from "../mcp/types.js";
import { IWD_SEARCH_TERMS, IWD_BRAND } from "../mcp/types.js";

export function registerAmplifierTools(server: McpServer, client: ToolClient): void {
  createZodTool(server, {
    name: "iwd_amplify_stories",
    description:
      "Find top women-in-tech HN stories and generate a visual summary image. Combines search with image generation.",
    schema: {
      topic: z.string().optional().describe("Specific topic to search (defaults to curated IWD terms)"),
      limit: z.number().int().min(1).max(20).default(5).describe("Number of stories to find"),
    },
    async handler({ topic, limit }) {
      const searchQuery = topic ?? IWD_SEARCH_TERMS[0];

      const searchResult = await client.callTool("hn_search", {
        query: searchQuery,
        sortBy: "relevance",
        tags: "story",
        hitsPerPage: limit ?? 5,
        numericFilters: "points>10",
      });

      const summaryPrompt = [
        `Create an infographic summarizing "${searchQuery}" stories from HackerNews.`,
        `Theme: ${IWD_BRAND.tagline}.`,
        `Colors: purple (#A020F0), green (#44B78B), white.`,
        "Style: modern data visualization, clean typography.",
      ].join(" ");

      const imageResult = await client.callTool("img_generate", {
        prompt: summaryPrompt,
        aspect_ratio: "16:9",
      });

      return jsonResult({
        search_query: searchQuery,
        stories: extractContent(searchResult),
        summary_image: extractContent(imageResult),
      });
    },
  });

  createZodTool(server, {
    name: "iwd_amplify_comment",
    description:
      "Draft a supportive, thoughtful comment for a HN story about women in tech. NEVER auto-posts — returns draft text only.",
    schema: {
      story_id: z.number().int().describe("HackerNews story ID"),
      tone: z.enum(["supportive", "celebratory", "insightful"]).default("supportive").describe("Comment tone"),
    },
    async handler({ story_id, tone }) {
      const itemResult = await client.callTool("hn_get_item_with_comments", {
        id: story_id,
        commentDepth: 1,
        commentLimit: 5,
      });

      const storyContent = extractContent(itemResult);

      const toneGuide = {
        supportive: "encouraging and supportive, acknowledging the achievement",
        celebratory: "enthusiastic and celebratory, highlighting the impact",
        insightful: "thoughtful and insightful, adding context or perspective",
      };

      return jsonResult({
        story_id,
        story_context: storyContent,
        draft_comment: {
          tone,
          guidance: `Write a ${toneGuide[tone]} comment for this story. Be genuine, specific, and constructive. Reference the story content directly.`,
          note: "This is a DRAFT only. Review and personalize before posting. Never auto-post.",
          hashtags: IWD_BRAND.hashtags,
        },
      });
    },
  });
}

function extractContent(result: { content: Array<{ text: string }> }): string {
  return result.content[0]?.text ?? "";
}
