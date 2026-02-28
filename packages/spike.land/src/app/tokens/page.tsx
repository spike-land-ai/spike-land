"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { logger } from "@/lib/logger";
import { ENHANCEMENT_COSTS } from "@/lib/credits/costs";
import { TOKEN_PACKAGES } from "@/lib/stripe/client";
import type { TokenPackageId } from "@/lib/stripe/client";
import { cn } from "@/lib/utils";
import {
  Check,
  Clock,
  Coins,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useSession } from "@/lib/auth/client/hooks";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// Calculate value comparison for packages
function getPackageValueInfo(id: TokenPackageId) {
  const basePrice = TOKEN_PACKAGES.starter.price
    / TOKEN_PACKAGES.starter.tokens;
  const currentPrice = TOKEN_PACKAGES[id].price / TOKEN_PACKAGES[id].tokens;
  const savings = Math.round((1 - currentPrice / basePrice) * 100);

  const badges: {
    label: string;
    variant: "default" | "secondary" | "outline";
  }[] = [];

  if (id === "pro") {
    badges.push({ label: "Most Popular", variant: "default" });
  }
  if (id === "power") {
    badges.push({ label: "Best Value", variant: "secondary" });
  }
  if (savings > 0 && id !== "starter") {
    badges.push({ label: `Save ${savings}%`, variant: "outline" });
  }

  return { savings, badges };
}

function TokensPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const {
    remaining: balance,
    isLoading: balanceLoading,
    limit,
    used,
    usagePercent,
    estimatedEnhancements,
    refetch,
  } = useWorkspaceCredits({ autoRefreshOnFocus: true });

  // Show success toast when returning from successful payment
  useEffect(() => {
    const purchaseSuccess = searchParams.get("purchase");
    const subscriptionSuccess = searchParams.get("subscription");

    if (purchaseSuccess === "success") {
      toast.success("Payment successful!", {
        description: "Your credits have been added to your account.",
      });
      // Clean up URL without causing a page reload
      window.history.replaceState({}, "", "/tokens");
    }

    if (subscriptionSuccess === "success") {
      toast.success("Subscription activated!", {
        description: "Your subscription is now active. Credits have been active.",
      });
      // Clean up URL without causing a page reload
      window.history.replaceState({}, "", "/tokens");
    }
  }, [searchParams]);

  // Redirect unauthenticated users
  if (sessionStatus === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/tokens");
    return null;
  }

  const handlePurchase = async (packageId: TokenPackageId) => {
    if (!session) {
      router.push("/auth/signin?callbackUrl=/tokens");
      return;
    }

    setLoading(packageId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, mode: "payment" }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
        setLoading(null);
      }
    } catch (error) {
      logger.error("Checkout error", error);
      alert("Failed to start checkout");
      setLoading(null);
    }
  };

  // Get enhancement counts for each package
  const getEnhancementCounts = (tokens: number) => ({
    tier1K: Math.floor(tokens / ENHANCEMENT_COSTS.TIER_1K),
    tier2K: Math.floor(tokens / ENHANCEMENT_COSTS.TIER_2K),
    tier4K: Math.floor(tokens / ENHANCEMENT_COSTS.TIER_4K),
  });

  return (
    <div className="container mx-auto pt-24 pb-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Credits</h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          View your AI credit balance, usage, and monthly limits.
        </p>
      </div>

      {/* Current Balance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
        {/* Token Balance Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your AI Credits
            </CardTitle>
            <CardDescription>
              Credits are used for AI-powered image enhancements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-primary">
                  {balanceLoading
                    ? <RefreshCw className="h-10 w-10 animate-spin" />
                    : balance}
                </div>
                <p className="text-muted-foreground mt-1">credits available</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {estimatedEnhancements && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Estimated enhancements remaining:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {estimatedEnhancements.tier1K}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      1K quality
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {estimatedEnhancements.tier2K}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      2K quality
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {estimatedEnhancements.tier4K}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      4K quality
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Monthly Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium">{used} / {limit} credits</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {usagePercent}% of monthly limit used
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Monthly Limit</p>
              <p className="text-lg font-semibold">{limit} credits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Purchase Credits</h2>
          {(Object.entries(TOKEN_PACKAGES) as [
            TokenPackageId,
            typeof TOKEN_PACKAGES[TokenPackageId],
          ][]).map(
            ([id, pkg]) => {
              const { badges } = getPackageValueInfo(id);
              const enhancements = getEnhancementCounts(pkg.tokens);
              const isPopular = id === "pro";
              const isBestValue = id === "power";

              return (
                <Card
                  key={id}
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg",
                    isPopular && "border-primary border-2 scale-105 shadow-lg",
                    isBestValue && "border-green-500 border-2",
                  )}
                  data-testid={`package-card-${id}`}
                >
                  {/* Featured ribbon for popular */}
                  {isPopular && (
                    <div className="absolute top-4 -right-8 rotate-45 bg-primary text-primary-foreground text-xs py-1 px-8 font-medium">
                      Popular
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 min-h-[24px] mb-2">
                      {badges.map((badge, i) => (
                        <Badge
                          key={i}
                          variant={badge.variant}
                          className={cn(
                            "text-xs",
                            badge.label === "Best Value"
                              && "bg-green-500 hover:bg-green-600 text-white",
                          )}
                        >
                          {badge.label}
                        </Badge>
                      ))}
                    </div>

                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      {pkg.name}
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold text-foreground">
                      {pkg.tokens} tokens
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div>
                      <div className="text-3xl font-bold">
                        £{pkg.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        £{(pkg.price / pkg.tokens).toFixed(3)} per credit
                      </div>
                    </div>

                    <Separator />

                    {/* Enhancement estimates */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Enhance up to:
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>
                            <strong>{enhancements.tier1K}</strong> images at 1K
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>
                            <strong>{enhancements.tier2K}</strong> images at 2K
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>
                            <strong>{enhancements.tier4K}</strong> images at 4K
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={cn(
                        "w-full",
                        isPopular && "bg-primary hover:bg-primary/90",
                        isBestValue && "bg-green-500 hover:bg-green-600",
                      )}
                      variant={isPopular || isBestValue ? "default" : "outline"}
                      disabled={loading === id || sessionStatus === "loading"}
                      onClick={() => handlePurchase(id)}
                      data-testid={`buy-button-${id}`}
                    >
                      {loading === id
                        ? "Redirecting..."
                        : sessionStatus === "loading"
                        ? "Loading..."
                        : (
                          <>
                            <Zap className="h-4 w-4 mr-1.5" />
                            Upgrade Now
                          </>
                        )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            },
          )}
        </div>
      </div>

      {/* Token Usage Guide */}
      <div className="max-w-3xl mx-auto mb-12">
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              AI Credit Costs per Enhancement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-xl mx-auto">
                  {ENHANCEMENT_COSTS.TIER_1K}
                </div>
                <div>
                  <p className="font-semibold">1K Enhancement</p>
                  <p className="text-xs text-muted-foreground">
                    1024px resolution
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-xl mx-auto">
                  {ENHANCEMENT_COSTS.TIER_2K}
                </div>
                <div>
                  <p className="font-semibold">2K Enhancement</p>
                  <p className="text-xs text-muted-foreground">
                    2048px resolution
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-xl mx-auto">
                  {ENHANCEMENT_COSTS.TIER_4K}
                </div>
                <div>
                  <p className="font-semibold">4K Enhancement</p>
                  <p className="text-xs text-muted-foreground">
                    4096px resolution
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto pt-24 pb-8 px-4 flex justify-center">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TokensPageContent />
    </Suspense>
  );
}
