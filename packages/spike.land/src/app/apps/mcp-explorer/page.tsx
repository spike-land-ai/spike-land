import { McpExplorerClient } from "@/components/mcp/McpExplorerClient";
import type { Metadata } from "next";
import { Suspense } from "react";
import { McpPlaygroundClient } from "./components/McpPlaygroundClient";

const desc =
  "Explore every MCP tool with live Try It flows — search, filter by category, inspect schemas, and run tools directly in your browser. No setup required.";

export const metadata: Metadata = {
  title: "MCP Explorer — Spike Land",
  description: desc,
  openGraph: {
    title: "MCP Explorer — Spike Land",
    description: desc,
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Explorer — Spike Land",
    description: desc,
  },
};

export default function McpExplorerPage() {
  return (
    <>
      {/* App-local playground: 3-panel IDE-style tool browser */}
      <Suspense>
        <McpPlaygroundClient />
      </Suspense>

      {/* Original full-page explorer below the playground */}
      <Suspense>
        <McpExplorerClient />
      </Suspense>
    </>
  );
}
