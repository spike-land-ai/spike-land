import { auth } from "@/lib/auth";
import {
  getPersonaFromAnswers,
  type OnboardingData,
} from "@/lib/onboarding/personas";
import type { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const onboardingSchema = z.object({
  answers: z.array(z.boolean()).length(4),
});

/**
 * GET /api/onboarding — return the current user's onboarding persona (or null)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ onboarding: null });
  }

  const { data: config, error } = await tryCatch(
    prisma.workspaceConfig.findUnique({
      where: { userId: session.user.id },
      select: { settings: true },
    }),
  );

  if (error) {
    logger.error("Failed to fetch onboarding data:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const settings = (config?.settings ?? {}) as Record<string, unknown>;
  const onboarding = (settings.onboarding ?? null) as OnboardingData | null;

  return NextResponse.json({ onboarding });
}

/**
 * POST /api/onboarding — save answers and computed persona
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = onboardingSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const persona = getPersonaFromAnswers(validation.data.answers);
  if (!persona) {
    return NextResponse.json({ error: "Invalid answer combination" }, {
      status: 400,
    });
  }

  const onboardingData: OnboardingData = {
    personaId: persona.id,
    personaSlug: persona.slug,
    answers: validation.data.answers,
    completedAt: new Date().toISOString(),
  };

  // Upsert WorkspaceConfig, merging onboarding into settings
  const { data: existing, error: fetchError } = await tryCatch(
    prisma.workspaceConfig.findUnique({
      where: { userId: session.user.id },
      select: { settings: true },
    }),
  );

  if (fetchError) {
    logger.error("Failed to fetch config:", fetchError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  const currentSettings = (existing?.settings ?? {}) as Record<string, unknown>;
  const mergedSettings = { ...currentSettings, onboarding: onboardingData };

  const { error: saveError } = await tryCatch(
    prisma.workspaceConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        name: "default",
        settings: mergedSettings as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: mergedSettings as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  if (saveError) {
    logger.error("Failed to save onboarding:", saveError);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }

  return NextResponse.json({ persona, onboarding: onboardingData });
}
