"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDowngrade } from "@/hooks/useDowngrade";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Gauge,
  Mail,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { useSession } from "@/lib/auth/client/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

/**
 * Tier display data (inlined to avoid importing server-only stripe client).
 * Values match TIER_SUBSCRIPTIONS in @/lib/stripe/client.ts.
 */
const TIER_INFO: Record<
  string,
  {
    label: string;
    priceGBP: number;
    wellCapacity: number;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PREMIUM: {
    label: "Premium",
    priceGBP: 20,
    wellCapacity: 100,
    variant: "default",
  },
  STANDARD: {
    label: "Standard",
    priceGBP: 10,
    wellCapacity: 50,
    variant: "default",
  },
  BASIC: {
    label: "Basic",
    priceGBP: 5,
    wellCapacity: 20,
    variant: "secondary",
  },
  FREE: { label: "Free", priceGBP: 0, wellCapacity: 0, variant: "outline" },
};

const DEFAULT_TIER = TIER_INFO.FREE!;

function getTierInfo(tier: string | null): {
  label: string;
  priceGBP: number;
  wellCapacity: number;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const key = tier?.toUpperCase();
  if (key && TIER_INFO[key]) {
    return TIER_INFO[key];
  }
  return DEFAULT_TIER;
}

function SubscriptionPageContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();

  const {
    remaining,
    limit,
    used,
    tier,
    usagePercent,
    estimatedEnhancements,
    isLoading: isBalanceLoading,
    isLowCredits,
    isCriticalCredits,
    error: creditsError,
    refetch: refetchBalance,
  } = useWorkspaceCredits({ autoRefreshOnFocus: true });

  const {
    scheduleDowngrade,
    cancelDowngrade,
    scheduledDowngrade,
    isScheduling,
    isCanceling,
    error: downgradeError,
    clearScheduledDowngrade,
  } = useDowngrade();

  // Show success toast when returning from a successful upgrade
  useEffect(() => {
    const upgradeSuccess = searchParams.get("upgrade");
    const tierParam = searchParams.get("tier");

    if (upgradeSuccess === "success" && tierParam) {
      toast.success("Plan upgraded successfully!", {
        description: `Your subscription is now ${tierParam}. Enjoy your new benefits!`,
      });
      refetchBalance();
      window.history.replaceState({}, "", "/settings/subscription");
    }
  }, [searchParams, refetchBalance]);

  // Show error toasts
  useEffect(() => {
    const error = creditsError || downgradeError;
    if (error) {
      toast.error(error.message || "An error occurred", {
        description: "Please try again or contact support if the issue persists.",
      });
    }
  }, [creditsError, downgradeError]);

  // Handle auth states
  if (status === "loading" || isBalanceLoading) {
    return (
      <div
        className="container mx-auto pt-24 pb-8 px-4"
        data-testid="loading-state"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/?auth=required&callbackUrl=/settings/subscription");
  }

  const tierInfo = getTierInfo(tier);
  const isFree = !tier || tier.toUpperCase() === "FREE";

  const handleDowngrade = async (
    targetTier: "FREE" | "BASIC" | "STANDARD",
  ) => {
    const result = await scheduleDowngrade(targetTier);
    if (result.success) {
      refetchBalance();
      toast.success("Downgrade scheduled", {
        description: result.message
          || `Your plan will change to ${targetTier} at the end of your billing cycle.`,
      });
    }
  };

  const handleCancelDowngrade = async () => {
    const result = await cancelDowngrade();
    if (result.success) {
      clearScheduledDowngrade();
      refetchBalance();
      toast.success("Downgrade cancelled", {
        description: "Your current plan will remain active.",
      });
    }
  };

  const progressVariant = isCriticalCredits
    ? "destructive"
    : isLowCredits
    ? "warning"
    : "default";

  return (
    <div
      className="container mx-auto pt-24 pb-8 px-4 max-w-4xl"
      data-testid="subscription-page"
    >
      {/* Header with back button */}
      <div className="mb-8">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and credit balance
        </p>
      </div>

      {/* Current plan summary */}
      <Card className="mb-8" data-testid="current-plan-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CreditCard className="h-5 w-5" />
            Current Plan
            <Badge variant={tierInfo.variant} data-testid="tier-badge">
              {tierInfo.label}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your current subscription and credit balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">
                Credit Balance
              </span>
              <p className="text-2xl font-bold" data-testid="token-balance">
                {remaining}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">
                Credit Limit
              </span>
              <p className="text-2xl font-bold" data-testid="credit-limit">
                {limit}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">
                Monthly Price
              </span>
              <p className="text-2xl font-bold" data-testid="monthly-price">
                {tierInfo.priceGBP > 0 ? `\u00a3${tierInfo.priceGBP}` : "Free"}
              </p>
            </div>
          </div>

          {/* Usage progress */}
          {limit > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Credits used this cycle
                </span>
                <span className="font-medium">
                  {used} / {limit} ({usagePercent}%)
                </span>
              </div>
              <Progress
                value={usagePercent}
                variant={progressVariant}
                className="h-2"
                data-testid="usage-progress"
              />
              {isLowCredits && (
                <p
                  className="text-sm text-warning"
                  data-testid="low-credits-warning"
                >
                  {isCriticalCredits
                    ? "Credits critically low. Consider upgrading your plan."
                    : "Credits running low."}
                </p>
              )}
            </div>
          )}

          {/* Well capacity (for paid tiers) */}
          {tierInfo.wellCapacity > 0 && (
            <div className="mt-4 p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Well Capacity:</span>
                <span className="font-medium">
                  {tierInfo.wellCapacity} tokens
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estimated enhancements */}
      <Card className="mb-8" data-testid="enhancements-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Estimated Enhancements Remaining
          </CardTitle>
          <CardDescription>
            Based on your current credit balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {estimatedEnhancements.tier1K}
              </p>
              <p className="text-sm text-muted-foreground">1K tier</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {estimatedEnhancements.tier2K}
              </p>
              <p className="text-sm text-muted-foreground">2K tier</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {estimatedEnhancements.tier4K}
              </p>
              <p className="text-sm text-muted-foreground">4K tier</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled downgrade notice */}
      {scheduledDowngrade && (
        <Card
          className="mb-8 border-yellow-500/30"
          data-testid="scheduled-downgrade-card"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Calendar className="h-5 w-5" />
              Downgrade Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Your plan will change to{" "}
                <Badge variant="secondary">
                  {scheduledDowngrade.targetTier}
                </Badge>{" "}
                on {scheduledDowngrade.effectiveDate.toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCancelDowngrade}
              loading={isCanceling}
              data-testid="cancel-downgrade-button"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Downgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Downgrade option for paid tiers */}
      {!isFree && !scheduledDowngrade && (
        <Card className="mb-8" data-testid="downgrade-card">
          <CardHeader>
            <CardTitle>Change Plan</CardTitle>
            <CardDescription>
              Downgrades take effect at the end of your current billing cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tier?.toUpperCase() !== "BASIC" && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium">Basic</p>
                  <p className="text-sm text-muted-foreground">
                    {TIER_INFO.BASIC?.wellCapacity} token well capacity - {"\u00a3"}
                    {TIER_INFO.BASIC?.priceGBP}/mo
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDowngrade("BASIC")}
                  loading={isScheduling}
                  data-testid="downgrade-basic-button"
                >
                  Downgrade
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="font-medium">Free</p>
                <p className="text-sm text-muted-foreground">
                  Basic access with limited credits
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDowngrade("FREE")}
                loading={isScheduling}
                data-testid="downgrade-free-button"
              >
                Downgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade prompt for free/lower tiers */}
      {(isFree || tier?.toUpperCase() === "BASIC") && (
        <Card className="mb-8 border-primary/30" data-testid="upgrade-card">
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Get more credits and higher well capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              To upgrade your plan, please contact our support team. We will help you find the right
              plan for your needs.
            </p>
            <Button variant="default" asChild>
              <a href="mailto:support@spike.land">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support to Upgrade
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Questions about billing or subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you have questions about your subscription, billing, or need to make changes, please
            contact our support team.
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:support@spike.land">Contact Support</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}
    >
      <SubscriptionPageContent />
    </Suspense>
  );
}
