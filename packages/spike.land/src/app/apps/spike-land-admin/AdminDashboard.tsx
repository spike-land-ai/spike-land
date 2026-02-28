"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  Database,
  Settings,
  Shield,
  Users,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "users", label: "Users", icon: Users },
  { id: "system", label: "System", icon: Activity },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "database", label: "Database", icon: Database },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-bold">Spike Land Admin</h1>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card/50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto max-w-md space-y-4">
            {(() => {
              const tab = TABS.find(t => t.id === activeTab);
              const Icon = tab?.icon ?? Shield;
              return (
                <>
                  <Icon className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h2 className="text-lg font-semibold capitalize">
                    {activeTab}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This section is being rebuilt. Admin functionality will be added incrementally
                    via tickets.
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
