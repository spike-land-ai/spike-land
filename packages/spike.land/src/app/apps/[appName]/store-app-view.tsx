"use client";

import { cn } from "@/lib/utils";
import { CodespaceAppEmbed } from "@/components/store/codespace-app-embed";
import { AlertTriangle, ExternalLink, Package } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface AppInfo {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  toolCount: number;
}

interface DeploymentInfo {
  id: string;
  baseCodespaceId: string;
  variants: Array<{
    id: string;
    codespaceId: string;
    variantLabel: string;
    dimension: string;
  }>;
}

interface StoreAppViewProps {
  app: AppInfo;
  deployment: DeploymentInfo | null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "spike-visitor-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function StoreAppView({ app, deployment }: StoreAppViewProps) {
  const assignedVariant = useMemo(() => {
    if (!deployment || deployment.variants.length === 0) return null;
    const visitorId = getVisitorId();
    const idx = hashString(visitorId + deployment.id)
      % deployment.variants.length;
    return deployment.variants[idx]!;
  }, [deployment]);

  // No active deployment — show placeholder with app info
  if (!deployment || !assignedVariant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground">{app.tagline}</p>
          <p className="text-sm text-muted-foreground">{app.description}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span>
              This app is being deployed to a codespace. Check back soon.
            </span>
          </div>
          <Link
            href="/store"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "font-medium text-sm transition-colors",
            )}
          >
            <ExternalLink className="w-4 h-4" />
            Browse App Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] w-full">
      <CodespaceAppEmbed
        appSlug={app.slug}
        codespaceId={assignedVariant.codespaceId}
        variantId={assignedVariant.id}
        className="flex-1"
      />
    </div>
  );
}
