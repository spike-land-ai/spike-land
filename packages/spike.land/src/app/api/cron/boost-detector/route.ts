export const maxDuration = 60;

/**
 * GET /api/cron/boost-detector
 * Daily cron job to detect boost opportunities
 * Runs at 6 AM UTC daily
 * Issue #565 - Content-to-Ads Loop
 */

import { detectBoostOpportunities } from "@/lib/boost-detector/detector";
import type { BoostDetectorConfig } from "@/lib/boost-detector/types";
import { validateCronSecret } from "@/lib/cron-auth";
import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret — must be set and match with timing-safe comparison
    if (!validateCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config: BoostDetectorConfig = {
      engagementThreshold: 0.05, // 5%
      velocityThreshold: 10, // 10 engagements/hour
      minImpressions: 100,
      lookbackPeriod: 7, // 7 days
    };

    // Get all active workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    let totalRecommendations = 0;
    const results = [];

    // Process each workspace
    for (const workspace of workspaces) {
      try {
        const recommendations = await detectBoostOpportunities(
          workspace.id,
          config,
        );
        totalRecommendations += recommendations.length;
        results.push({
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          recommendationsGenerated: recommendations.length,
        });
      } catch (error) {
        logger.error(
          `Error detecting opportunities for workspace ${workspace.id}:`,
          error,
        );
        results.push({
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          error: (error as Error).message,
        });
      }
    }

    // Expire old pending recommendations
    await prisma.postBoostRecommendation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    return NextResponse.json({
      success: true,
      workspacesProcessed: workspaces.length,
      totalRecommendations,
      results,
    });
  } catch (error) {
    logger.error("Boost detector cron error:", error);
    return NextResponse.json(
      {
        error: "Boost detector cron failed",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
