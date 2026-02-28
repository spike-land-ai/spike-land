import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { redirect } from "next/navigation";
import { McpDashboardClient } from "./McpDashboardClient";

export const metadata = {
  title: "MCP Observability Dashboard - spike.land Admin",
  description: "Per-tool metrics, system health, and user analytics for MCP tools.",
};

export default async function McpDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const hasAccess = await verifyAdminAccess(session);
  if (!hasAccess) {
    redirect("/");
  }

  return <McpDashboardClient />;
}
