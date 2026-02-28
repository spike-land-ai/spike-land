import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DynamicPageRenderer } from "@/components/dynamic-pages/DynamicPageRenderer";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string[]; }>;
}

async function getPageBySlug(slug: string) {
  const prisma = (await import("@/lib/prisma")).default;
  return prisma.dynamicPage.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const joinedSlug = slug.join("/");
  const page = await getPageBySlug(joinedSlug);

  if (!page) {
    return { title: "Page Not Found | Spike Land" };
  }

  return {
    title: page.seoTitle ?? `${page.title} | Spike Land`,
    description: page.seoDescription ?? page.description,
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.description ?? undefined,
      url: `https://spike.land/p/${page.slug}`,
      images: page.ogImageUrl ? [{ url: page.ogImageUrl }] : undefined,
    },
  };
}

export default async function DynamicPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const joinedSlug = slug.join("/");
  const page = await getPageBySlug(joinedSlug);

  if (!page) {
    notFound();
  }

  // Fire-and-forget view count increment
  import("@/lib/prisma").then(mod =>
    mod.default.dynamicPage
      .update({
        where: { id: page.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(err => logger.error("[dynamic-page] Failed to increment view count", err))
  );

  return <DynamicPageRenderer page={page} />;
}
