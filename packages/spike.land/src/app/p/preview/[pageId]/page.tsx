import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { DynamicPageRenderer } from "@/components/dynamic-pages/DynamicPageRenderer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ pageId: string; }>;
}

export default async function PreviewPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/?auth=required");
  }

  const { pageId } = await params;
  const prisma = (await import("@/lib/prisma")).default;

  const page = await prisma.dynamicPage.findUnique({
    where: { id: pageId },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page) {
    notFound();
  }

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 text-center py-2 text-sm font-medium">
        Preview Mode — This page is {page.status.toLowerCase()} and not publicly visible
      </div>
      <div className="pt-10">
        <DynamicPageRenderer page={page} />
      </div>
    </div>
  );
}
