import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { StateMachineView } from "./StateMachineView";
import type { MachineExport } from "@/lib/state-machine/types";

export async function generateMetadata(
  { params }: { params: Promise<{ token: string; }>; },
): Promise<Metadata> {
  const { token } = await params;
  const machine = await prisma.stateMachine.findUnique({
    where: { shareToken: token },
    select: { name: true },
  });

  if (!machine) {
    return {
      title: "Machine Not Found | spike.land",
    };
  }

  return {
    title: `${machine.name} | Shared State Machine | spike.land`,
    description: `View and simulate the "${machine.name}" state machine on spike.land.`,
  };
}

export default async function SharedMachinePage(
  { params }: { params: Promise<{ token: string; }>; },
) {
  const { token } = await params;
  const shared = await prisma.stateMachine.findUnique({
    where: { shareToken: token },
  });

  if (!shared) {
    notFound();
  }

  const machineData: MachineExport = {
    definition: JSON.parse(
      JSON.stringify(shared.definition),
    ) as MachineExport["definition"],
    currentStates: shared.currentStates,
    context: (shared.context ?? {}) as Record<string, unknown>,
    history: (shared.history ?? {}) as Record<string, string[]>,
    transitionLog: JSON.parse(
      JSON.stringify(shared.transitionLog ?? []),
    ) as MachineExport["transitionLog"],
  };

  return (
    <div className="flex flex-col h-screen bg-[hsl(240,6%,7%)]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading machine...
          </div>
        }
      >
        <StateMachineView initialData={machineData} machineName={shared.name} />
      </Suspense>
    </div>
  );
}
