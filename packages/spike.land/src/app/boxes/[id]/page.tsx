import { auth } from "@/lib/auth";
import { AgentControlPanel } from "@/components/boxes/agent-control-panel";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoxDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/?auth=required");
  }

  const { id } = await params;

  const box = await prisma.box.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!box) {
    notFound();
  }

  // Verify user owns the box
  if (box.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="container mx-auto pt-24 pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{box.name}</h1>
        {box.description && <p className="text-muted-foreground mt-2">{box.description}</p>}
      </div>
      <AgentControlPanel box={box} />
    </div>
  );
}
