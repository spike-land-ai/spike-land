"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Layers, RefreshCw, Users, Wrench } from "lucide-react";
import { getStoreStats } from "@/app/store/data/store-apps";

interface StoreStatsBarProps {
  appCount?: number;
}

export function StoreStatsBar({ appCount }: StoreStatsBarProps) {
  const storeStats = getStoreStats();
  const resolvedAppCount = appCount ?? storeStats.appCount;

  const stats = [
    {
      icon: RefreshCw,
      value: `${resolvedAppCount}`,
      label: "Apps",
      color: "text-cyan-400",
    },
    {
      icon: Wrench,
      value: "All",
      label: "First Party",
      color: "text-fuchsia-400",
    },
    {
      icon: Layers,
      value: `${storeStats.categoryCount}`,
      label: "Categories",
      color: "text-amber-400",
    },
    {
      icon: Users,
      value: `${storeStats.developerCount}`,
      label: "Developers",
      color: "text-emerald-400",
    },
  ];

  return (
    <ScrollReveal>
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card/30 backdrop-blur-xl p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-white/10">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-2 px-4"
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  <span className="text-3xl font-black text-white">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
