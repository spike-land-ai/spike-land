export const maxDuration = 60;

/**
 * GET /api/cron/boost-performance-sync
 * Hourly cron job to sync boost performance from platforms
 * Issue #565 - Content-to-Ads Loop
 */

import { syncCampaignMetrics } from "@/lib/boost-detector/platform-integration";
import { validateCronSecret } from "@/lib/cron-auth";
import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret — timing-safe comparison prevents brute-force
    if (!validateCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active applied boosts
    const activeBoosts = await prisma.appliedBoost.findMany({
      where: {
        status: "ACTIVE",
        externalCampaignId: {
          not: null,
        },
      },
    });

    let syncedCount = 0;
    let errorCount = 0;
    const results = [];

    // Sync metrics for each active boost
    for (const boost of activeBoosts) {
      if (!boost.externalCampaignId) continue;

      try {
        const metrics = await syncCampaignMetrics(
          boost.externalCampaignId,
          boost.platform,
        );

        // Calculate ROI
        const conversionValue = metrics.conversions * 50; // $50 per conversion
        const actualROI = metrics.spend > 0
          ? (conversionValue - metrics.spend) / metrics.spend
          : 0;

        // Update boost with new metrics
        await prisma.appliedBoost.update({
          where: { id: boost.id },
          data: {
            actualImpressions: metrics.impressions,
            actualClicks: metrics.clicks,
            actualConversions: metrics.conversions,
            actualSpend: metrics.spend,
            actualROI,
          },
        });

        // Also update recommendation
        await prisma.postBoostRecommendation.update({
          where: { id: boost.recommendationId },
          data: {
            actualSpend: metrics.spend,
            actualROI,
          },
        });

        syncedCount++;
        results.push({
          boostId: boost.id,
          campaignId: boost.externalCampaignId,
          platform: boost.platform,
          synced: true,
        });
      } catch (error) {
        errorCount++;
        logger.error(
          `Error syncing metrics for boost ${boost.id}:`,
          error,
        );
        results.push({
          boostId: boost.id,
          campaignId: boost.externalCampaignId,
          platform: boost.platform,
          synced: false,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalBoosts: activeBoosts.length,
      syncedCount,
      errorCount,
      results: results.slice(0, 20), // Limit to first 20 results
    });
  } catch (error) {
    logger.error("Performance sync cron error:", error);
    return NextResponse.json(
      {
        error: "Performance sync cron failed",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
