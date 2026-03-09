/**
 * Store Search MCP Tools (CF Workers)
 *
 * Search, browse, and inspect apps in the spike.land app store.
 * Proxies to spike.land API for store app data.
 */

import { z } from "zod";
import type { ToolRegistryAdapter } from "../../../lazy-imports/types";
import { freeTool } from "../../../lazy-imports/procedures-index.ts";
import { eq, like, or, and, asc, desc } from "drizzle-orm";
import { apiRequest, safeToolCall, textResult } from "../../lib/tool-helpers";
import type { DrizzleDB } from "../../../db/db/db-index.ts";
import { mcpApps } from "../../../db/db/schema.ts";

export function registerStoreSearchTools(
  registry: ToolRegistryAdapter,
  userId: string,
  db: DrizzleDB,
): void {
  const t = freeTool(userId, db);

  registry.registerBuilt(
    t
      .tool(
        "store_list_apps_with_tools",
        "List all store apps with their MCP tool names for CLI tool grouping.",
        {},
      )
      .meta({ category: "store-search", tier: "free" })
      .handler(async () => {
        return safeToolCall("store_list_apps_with_tools", async () => {
          const rows = await db
            .select({
              slug: mcpApps.slug,
              name: mcpApps.name,
              icon: mcpApps.emoji,
              tagline: mcpApps.description,
              toolsStr: mcpApps.tools,
            })
            .from(mcpApps)
            .where(eq(mcpApps.status, "live"));

          const apps = rows.map((r) => {
            let toolNames: string[] = [];
            try {
              toolNames = JSON.parse(r.toolsStr) as string[];
            } catch {
              // Ignore
            }

            return {
              slug: r.slug,
              name: r.name,
              icon: r.icon,
              category: "developer",
              tagline: r.tagline,
              toolNames,
            };
          });

          return textResult(JSON.stringify(apps));
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool(
        "store_search",
        "Score-ranked search across app names, taglines, descriptions, and tags.",
        {
          query: z
            .string()
            .min(1)
            .describe("Search query to match against app names, taglines, descriptions, and tags"),
          category: z.string().optional().describe("Optional category filter"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .optional()
            .default(10)
            .describe("Max results to return (default 10)"),
        },
      )
      .meta({ category: "store-search", tier: "free" })
      .handler(async ({ input }) => {
        return safeToolCall("store_search", async () => {
          if (input.category && input.category.toLowerCase() !== "developer") {
             return textResult(`No apps found matching "${input.query}" in category "${input.category}".`);
          }

          const q = `%${input.query}%`;
          const rows = await db
            .select({
              name: mcpApps.name,
              tagline: mcpApps.description,
              slug: mcpApps.slug,
              sortOrder: mcpApps.sortOrder,
            })
            .from(mcpApps)
            .where(
              and(
                eq(mcpApps.status, "live"),
                or(
                  like(mcpApps.name, q),
                  like(mcpApps.description, q),
                  like(mcpApps.slug, q),
                  like(mcpApps.markdown, q),
                ),
              ),
            );

          // Simple score based on where it matches and sort_order
          const scored = rows.map((r) => {
            let score = 0;
            const nameLC = r.name.toLowerCase();
            const descLC = r.tagline.toLowerCase();
            const queryLC = input.query.toLowerCase();

            if (nameLC === queryLC) score += 100;
            else if (nameLC.includes(queryLC)) score += 50;

            if (descLC.includes(queryLC)) score += 10;

            score -= r.sortOrder; // lower sort_order is better
            return { ...r, score };
          });

          scored.sort((a, b) => b.score - a.score);
          const results = scored.slice(0, input.limit);

          if (results.length === 0) {
            return textResult(`No apps found matching "${input.query}".`);
          }

          const list = results
            .map((a) => `- **${a.name}** — ${a.tagline} (\`${a.slug}\`)`)
            .join("\n");
          return textResult(`## Search Results for "${input.query}"\n\n${list}`);
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool("store_browse_category", "Browse all apps in a given store category.", {
        category: z
          .string()
          .min(1)
          .describe("Category to browse (e.g. developer, creative, productivity)"),
      })
      .meta({ category: "store-search", tier: "free" })
      .handler(async ({ input }) => {
        return safeToolCall("store_browse_category", async () => {
          if (input.category.toLowerCase() !== "developer") {
            return textResult(`No apps found in category "${input.category}".`);
          }

          const apps = await db
            .select({
              name: mcpApps.name,
              tagline: mcpApps.description,
              slug: mcpApps.slug,
            })
            .from(mcpApps)
            .where(eq(mcpApps.status, "live"))
            .orderBy(asc(mcpApps.sortOrder));

          if (apps.length === 0) {
            return textResult(`No apps found in category "${input.category}".`);
          }

          const list = apps.map((a) => `- **${a.name}** — ${a.tagline} (\`${a.slug}\`)`).join("\n");
          return textResult(`## ${input.category} Apps\n\n${list}`);
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool("store_featured_apps", "List all featured apps in the store.", {})
      .meta({ category: "store-search", tier: "free" })
      .handler(async () => {
        return safeToolCall("store_featured_apps", async () => {
          const apps = await db
            .select({
              name: mcpApps.name,
              tagline: mcpApps.description,
              slug: mcpApps.slug,
            })
            .from(mcpApps)
            .where(eq(mcpApps.status, "live"))
            .orderBy(asc(mcpApps.sortOrder))
            .limit(10);

          if (apps.length === 0) {
            return textResult("No featured apps at the moment.");
          }

          const list = apps.map((a) => `- **${a.name}** — ${a.tagline} (\`${a.slug}\`)`).join("\n");
          return textResult(`## Featured Apps\n\n${list}`);
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool("store_new_apps", "List all new apps in the store.", {})
      .meta({ category: "store-search", tier: "free" })
      .handler(async () => {
        return safeToolCall("store_new_apps", async () => {
          const apps = await db
            .select({
              name: mcpApps.name,
              tagline: mcpApps.description,
              slug: mcpApps.slug,
            })
            .from(mcpApps)
            .where(eq(mcpApps.status, "live"))
            .orderBy(desc(mcpApps.createdAt))
            .limit(10);

          if (apps.length === 0) {
            return textResult("No new apps at the moment.");
          }

          const list = apps.map((a) => `- **${a.name}** — ${a.tagline} (\`${a.slug}\`)`).join("\n");
          return textResult(`## New Apps\n\n${list}`);
        });
      }),
  );

  registry.registerBuilt(
    t
      .tool("store_app_detail", "Get detailed information about a specific store app by slug.", {
        slug: z.string().min(1).describe("The app slug to get details for"),
      })
      .meta({ category: "store-search", tier: "free" })
      .handler(async ({ input }) => {
        return safeToolCall("store_app_detail", async () => {
          const rows = await db
            .select()
            .from(mcpApps)
            .where(eq(mcpApps.slug, input.slug))
            .limit(1);

          const appRow = rows[0];

          if (!appRow || appRow.status !== "live") {
            return textResult(`App "${input.slug}" not found.`);
          }

          const isFeatured = appRow.sortOrder < 100;
          const isNew = Date.now() - appRow.createdAt * 1000 < 1000 * 60 * 60 * 24 * 7; // 7 days

          const tags = "None";

          const card = [
            `## ${appRow.name}`,
            `*${appRow.description}*`,
            "",
            appRow.markdown || appRow.description,
            "",
            `| Field | Value |`,
            `| --- | --- |`,
            `| Category | developer |`,
            `| Tags | ${tags} |`,
            `| Pricing | Free |`,
            `| Tools | ${appRow.toolCount} |`,
            `| Featured | ${isFeatured ? "Yes" : "No"} |`,
            `| New | ${isNew ? "Yes" : "No"} |`,
          ].join("\n");

          return textResult(card);
        });
      }),
  );
}
