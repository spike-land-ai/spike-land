import { useAuth } from "@/hooks/useAuth";

export function SettingsPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Profile</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-foreground">Display Name</label>
            <input
              id="displayName"
              type="text"
              defaultValue={isAuthenticated ? (user?.name ?? "") : ""}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              type="email"
              defaultValue={isAuthenticated ? (user?.email ?? "") : ""}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="avatarUrl" className="mb-1 block text-sm font-medium text-foreground">Avatar URL</label>
            <input
              id="avatarUrl"
              type="url"
              defaultValue={isAuthenticated ? ((user?.picture as string) ?? "") : ""}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://..."
            />
          </div>
          <button className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
