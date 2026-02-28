import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/auth/admin-middleware";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = await verifyAdminAccess(session);

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
