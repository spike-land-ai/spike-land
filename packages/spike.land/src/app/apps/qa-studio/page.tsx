import { auth } from "@/lib/auth";
import { QaStudioClient } from "@/components/admin/qa-studio/QaStudioClient";
import { QaStudioDashboard } from "./components/QaStudioDashboard";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "QA Studio | Spike Land",
  description: "Web QA automation and testing dashboard",
};

export default async function QaStudioPage() {
  const session = await auth();

  if (
    !session?.user
    || (session.user.role !== UserRole.ADMIN
      && session.user.role !== UserRole.SUPER_ADMIN)
  ) {
    redirect("/");
  }

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">
            QA Studio
          </h2>
          <p className="text-muted-foreground">
            QA Studio is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">QA Studio</h2>
        </div>
        {/* Rich dashboard with decomposed components */}
        <QaStudioDashboard />
        {/* Legacy browser automation panel */}
        <div className="border-t border-border/30 pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Browser Automation
          </h3>
          <QaStudioClient />
        </div>
      </div>
    </div>
  );
}
