import { GenerationShell } from "@/components/generate/generation-shell";
import { getRouteBySlug, incrementViewCount } from "@/lib/generate/route-cache";
import { GeneratedRouteStatus } from "@prisma/client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string[]; }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) return { title: "Spike Land AI" };

  const path = slug.join("/");
  let route: Awaited<ReturnType<typeof getRouteBySlug>> = null;
  try {
    route = await getRouteBySlug(path);
  } catch {
    // Table may not exist yet or DB unavailable — fall through to defaults
  }

  return {
    title: route?.title
      ? `${route.title} | Spike Land AI`
      : `${path.replace(/-/g, " ")} | Spike Land AI`,
    description: route?.description
      ?? `Explore ${path.replace(/-/g, " ")} on Spike Land`,
  };
}

export default async function GeneratedRoutePage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug?.length) {
    return <GenerationShell slug="" />;
  }

  const path = slug.join("/");
  let route: Awaited<ReturnType<typeof getRouteBySlug>> = null;
  try {
    route = await getRouteBySlug(path);
  } catch {
    // Table may not exist yet or DB unavailable — fall through to GenerationShell
  }

  // Published: show iframe
  if (route?.status === GeneratedRouteStatus.PUBLISHED && route.codespaceUrl) {
    void incrementViewCount(path);
    return (
      <div className="h-screen w-full">
        <iframe
          src={route.codespaceUrl}
          className="w-full h-full border-0"
          title={route.title ?? path}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    );
  }

  // Generating or New: show generation shell
  return <GenerationShell slug={path} />;
}
