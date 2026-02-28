import { McpCategoriesPageClient } from "@/components/mcp/McpCategoriesPageClient";
import { ACTIVE_CATEGORY_COUNT } from "@/components/mcp/mcp-tool-registry";
import type { Metadata } from "next";

const desc =
  `Browse ${ACTIVE_CATEGORY_COUNT} app categories. Try apps inline with progressive disclosure.`;

export const metadata: Metadata = {
  title: "Tool Categories - MCP Server - Spike Land",
  description: desc,
  openGraph: {
    title: "Tool Categories - MCP Server - Spike Land",
    description: desc,
  },
  twitter: {
    card: "summary_large_image",
    title: "Tool Categories - MCP Server - Spike Land",
    description: desc,
  },
};

export default function McpCategoriesPage() {
  return <McpCategoriesPageClient />;
}
