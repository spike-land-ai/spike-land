/**
 * iwd_contributor_spotlight
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool, jsonResult } from "@spike-land-ai/mcp-server-base";
import type { ToolClient } from "../mcp/types.js";
import { IWD_BRAND } from "../mcp/types.js";

export function registerContributorTools(server: McpServer, client: ToolClient): void {
  createZodTool(server, {
    name: "iwd_contributor_spotlight",
    description:
      "Spotlight a GitHub PR contributor with a recognition card. Fetches PR details and generates a celebration image.",
    schema: {
      owner: z.string().describe("Repository owner (e.g. 'spike-land-ai')"),
      repo: z.string().describe("Repository name"),
      pr_number: z.number().int().describe("Pull request number"),
      message: z.string().optional().describe("Custom recognition message"),
    },
    async handler({ owner, repo, pr_number, message }) {
      const prResult = await client.callTool("get_pr_details", {
        owner,
        repo,
        pr_number,
      });

      const prContent = extractContent(prResult);

      const cardPrompt = [
        `Create a contributor recognition card for PR #${pr_number} in ${owner}/${repo}.`,
        message ? `Message: "${message}".` : "Message: Thank you for your contribution!",
        `Theme: ${IWD_BRAND.tagline} contributor spotlight.`,
        "Style: modern celebration card with code elements, stars, confetti.",
        `Colors: purple (#A020F0), green (#44B78B), white.`,
        `Include text: "${IWD_BRAND.hashtags[0]} Contributor Spotlight"`,
      ].join(" ");

      const cardResult = await client.callTool("img_generate", {
        prompt: cardPrompt,
        aspect_ratio: "1:1",
      });

      return jsonResult({
        pr: {
          owner,
          repo,
          number: pr_number,
          details: prContent,
        },
        recognition: {
          message: message ?? "Thank you for your contribution!",
          card: extractContent(cardResult),
          hashtags: IWD_BRAND.hashtags,
        },
      });
    },
  });
}

function extractContent(result: { content: Array<{ text: string }> }): string {
  return result.content[0]?.text ?? "";
}
