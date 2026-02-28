/**
 * BAZDMEG Developer Dashboard Page
 *
 * Server component — auth check.
 * Requires ADMIN or SUPER_ADMIN role.
 */

import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const hasAccess = await verifyAdminAccess(session);
  if (!hasAccess) {
    redirect("/");
  }

  return <DashboardClient userName={session.user.name ?? "Admin"} />;
}
