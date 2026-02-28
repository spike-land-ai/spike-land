import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppBySlug } from "@/app/store/data/store-apps";
import { StoreAppView } from "./store-app-view";

interface PageProps {
  params: Promise<{ appName: string; }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { appName } = await params;
  const app = getAppBySlug(appName);
  if (!app) return { title: "App Not Found | spike.land" };
  return {
    title: `${app.name} | spike.land`,
    description: app.description,
  };
}

export default async function DynamicAppPage({ params }: PageProps) {
  const { appName } = await params;
  const app = getAppBySlug(appName);
  if (!app) notFound();

  // Look up active deployment from DB
  let deployment: {
    id: string;
    baseCodespaceId: string;
    variants: Array<{
      id: string;
      codespaceId: string;
      variantLabel: string;
      dimension: string;
    }>;
  } | null = null;

  try {
    const prisma = (await import("@/lib/prisma")).default;
    deployment = await prisma.storeAppDeployment.findFirst({
      where: { appSlug: appName, status: "LIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        baseCodespaceId: true,
        variants: {
          select: {
            id: true,
            codespaceId: true,
            variantLabel: true,
            dimension: true,
          },
        },
      },
    });
  } catch {
    // DB unavailable — fall through to no-deployment UI
  }

  return (
    <StoreAppView
      app={{
        slug: app.slug,
        name: app.name,
        tagline: app.tagline,
        description: app.description,
        icon: app.icon,
        toolCount: app.toolCount,
      }}
      deployment={deployment}
    />
  );
}
