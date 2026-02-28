import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { McpHistoryClient } from "./McpHistoryClient";

export const metadata = {
  title: "MCP Usage History - Spike Land",
  description: "View your MCP API usage history for image generation and modification",
};

export default async function McpHistoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/?auth=required&callbackUrl=/settings/mcp-history");
  }

  return <McpHistoryClient />;
}
