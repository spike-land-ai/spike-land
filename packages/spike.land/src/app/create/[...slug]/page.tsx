import { LiveAppDisplay } from "@/components/create/live-app-display";
import { RelatedApps } from "@/components/create/related-apps";
import { StreamingApp } from "@/components/create/streaming-app";
import {
  getCreatedApp,
  getRelatedPublishedApps,
  incrementViewCount,
  triggerReReview,
} from "@/lib/create/content-service";
import { isCodespaceHealthy } from "@/lib/create/codespace-health";
import { CreatedAppStatus } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Force dynamic rendering to avoid static analysis issues with catch-all params
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  // Defensive check for static analysis - slug may be undefined during build
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return { title: "Create | Spike Land AI" };
  }

  const path = slug.join("/");

  // Fetch app if exists to get real title
  const app = await getCreatedApp(path);

  return {
    title: app?.title
      ? `${app.title} | Spike Land AI`
      : `Create ${path} | Spike Land AI`,
    description: app?.description || `Generate a React app for ${path}`,
  };
}

export default async function CreatePage({ params }: PageProps) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams?.slug;

  if (
    !pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0
  ) {
    notFound();
  }

  const slug = pathSegments.join("/");
  const [app, relatedApps] = await Promise.all([
    getCreatedApp(slug),
    getRelatedPublishedApps(slug, 6),
  ]);

  // If app is published, verify health before showing
  if (
    app && app.status === CreatedAppStatus.PUBLISHED && app.codespaceId
    && app.codespaceUrl
  ) {
    // Check if the codespace is actually healthy
    const healthy = await isCodespaceHealthy(app.codespaceId);
    if (!healthy) {
      // Trigger background re-review (marks as FAILED so it drops from listings)
      void triggerReReview(app);
      // Show the streaming UI which will display the error state
      return (
        <div className="min-h-screen bg-background">
          <StreamingApp path={pathSegments} />
        </div>
      );
    }

    // Fire-and-forget view count increment
    void incrementViewCount(slug);
    return (
      <div className="flex h-[calc(100dvh-4rem)] bg-background overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <LiveAppDisplay
            codespaceId={app.codespaceId}
            codespaceUrl={app.codespaceUrl}
            title={app.title}
            slug={app.slug}
          />
        </div>
        <RelatedApps links={app.outgoingLinks} publishedApps={relatedApps} />
      </div>
    );
  }

  // Otherwise (Generating, Failed, or New), show streaming UI
  return (
    <div className="min-h-screen bg-background">
      <StreamingApp path={pathSegments} />
    </div>
  );
}
