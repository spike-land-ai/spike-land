/**
 * iwd_spotlight_search + iwd_spotlight_card
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool } from "@spike-land-ai/mcp-server-base";
import type { ToolClient } from "../mcp/types.js";
import { IWD_SEARCH_TERMS, spotlightPrompt } from "../mcp/types.js";

export function registerSpotlightTools(server: McpServer, client: ToolClient): void {
  createZodTool(server, {
    name: "iwd_spotlight_search",
    description:
      "Search HackerNews for stories by or about women in tech. Uses curated IWD search terms combined with your query.",
    schema: {
      query: z.string().optional().describe("Additional search query (combined with IWD terms)"),
      limit: z.number().int().min(1).max(50).default(10).describe("Max results"),
    },
    async handler({ query, limit }) {
      const searchQuery = query
        ? `${query} ${IWD_SEARCH_TERMS[0]}`
        : IWD_SEARCH_TERMS[Math.floor(Math.random() * IWD_SEARCH_TERMS.length)];

      const result = await client.callTool("hn_search", {
        query: searchQuery,
        sortBy: "relevance",
        tags: "story",
        hitsPerPage: limit ?? 10,
      });

      return result;
    },
  });

  createZodTool(server, {
    name: "iwd_spotlight_card",
    description:
      "Generate a beautiful IWD spotlight card celebrating a woman in tech. Produces an AI-generated image with name, role, and achievement.",
    schema: {
      name: z.string().describe("Name of the person to spotlight"),
      role: z.string().describe("Their role or title (e.g. 'CTO at Acme')"),
      achievement: z.string().describe("Key achievement to highlight"),
      style: z.string().optional().describe("Additional style instructions"),
    },
    async handler({ name, role, achievement, style }) {
      const prompt = spotlightPrompt(name, role, achievement) + (style ? ` ${style}` : "");

      const result = await client.callTool("img_generate", {
        prompt,
        aspect_ratio: "1:1",
      });

      return result;
    },
  });
}
