"use client";

import { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

import type { StoreApp } from "@/app/store/data/store-apps";
import { StoreAppCard } from "./store-app-card";

interface StoreAppGridProps {
  apps: StoreApp[];
  viewMode?: "grid" | "list";
}

export function StoreAppGrid({ apps, viewMode = "grid" }: StoreAppGridProps) {
  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-lg text-muted-foreground">No apps in this category</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <StaggerContainer>
        <div className="flex flex-col gap-3">
          {apps.map(app => (
            <StaggerItem key={app.id}>
              <StoreAppCard app={app} />
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps.map(app => (
          <StaggerItem key={app.id}>
            <StoreAppCard app={app} />
          </StaggerItem>
        ))}
      </div>
    </StaggerContainer>
  );
}

export function StoreAppGridSkeleton({ count = 6 }: { count?: number; }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-border bg-card/30 p-6 animate-pulse"
        >
          {/* Icon + title row */}
          <div className="flex items-start gap-4 mb-4">
            <div className="h-14 w-14 shrink-0 rounded-[16px] bg-muted/60" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded-lg bg-muted/60" />
              <div className="h-4 w-1/2 rounded-lg bg-muted/40" />
            </div>
          </div>
          {/* Description */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full rounded-lg bg-muted/40" />
            <div className="h-4 w-5/6 rounded-lg bg-muted/40" />
          </div>
          {/* Rating & install count placeholders */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-3 w-3 rounded-sm bg-muted/40" />
              ))}
            </div>
            <div className="h-3 w-12 rounded-lg bg-muted/40" />
          </div>
          {/* Badges */}
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted/40" />
            <div className="h-6 w-16 rounded-full bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
