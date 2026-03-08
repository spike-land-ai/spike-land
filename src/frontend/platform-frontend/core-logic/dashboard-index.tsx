import { useAuth } from "../ui/hooks/useAuth";
import { BuyCredits } from "../ui/components/BuyCredits";
import { CreditWidget } from "../ui/components/CreditWidget";
import { AuthGuard } from "../ui/components/AuthGuard";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <AuthGuard>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-foreground">
          {isAuthenticated ? `Welcome, ${user?.name ?? "User"}` : "Welcome to Spike"}
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Agent Status">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="text-lg font-medium text-foreground">--</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Connection status</p>
          </Card>
          <Card title="Recent Apps">
            <p className="text-sm text-muted-foreground">
              No recent apps yet. Create one to get started.
            </p>
          </Card>
          <Card title="Analytics Overview">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tool calls today</span>
                <span className="font-medium text-foreground">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active sessions</span>
                <span className="font-medium text-foreground">--</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <CreditWidget />
        </div>

        <BuyCredits />
      </div>
    </AuthGuard>
  );
}
