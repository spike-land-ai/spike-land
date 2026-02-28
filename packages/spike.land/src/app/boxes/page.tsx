import { auth } from "@/lib/auth";
import { BoxCard } from "@/components/boxes/box-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function BoxesPage() {
  const session = await auth();

  if (!session) {
    redirect("/?auth=required&callbackUrl=/boxes");
  }

  const boxes = await prisma.box.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      tier: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8 md:pb-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              My Boxes
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your browser agent boxes
            </p>
          </div>
          <Link href="/boxes/new">
            <Button size="lg" className="w-full sm:w-auto">
              Create New Box
            </Button>
          </Link>
        </div>

        {boxes.length === 0
          ? (
            <Card className="border-dashed" data-testid="boxes-empty-state">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">No boxes yet</CardTitle>
                <CardDescription className="mt-2">
                  Get started by creating your first remote browser box
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pb-8">
                <Link href="/boxes/new">
                  <Button size="lg" variant="default">
                    Create Your First Box
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
          : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {boxes
                .filter((
                  box,
                ): box is typeof box & { tier: NonNullable<typeof box.tier>; } => box.tier !== null)
                .map(box => <BoxCard key={box.id} box={box} />)}
            </div>
          )}
      </div>
    </div>
  );
}
