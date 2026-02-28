"use client";

import { ApiKeysTab } from "@/components/settings/api-keys-tab";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { logger } from "@/lib/logger";
import { CreditCard } from "lucide-react";
import { useSession } from "@/lib/auth/client/hooks";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const { data: session, status } = useSession();
  const { tier: currentTier, isLoading: isTierLoading } = useWorkspaceCredits();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") {
        logger.error("Auth loading timeout after 10 seconds");
        setLoadingTimeout(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "loading" && !loadingTimeout) {
    return (
      <div
        className="container mx-auto pt-24 pb-8 px-4"
        data-testid="loading-state"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If loading timed out, show error message
  if (loadingTimeout) {
    return (
      <div
        className="container mx-auto pt-24 pb-8 px-4"
        data-testid="loading-timeout-state"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">
            Authentication is taking longer than expected...
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/?auth=required&callbackUrl=/settings");
  }

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setDeleteDialogOpen(false);
  };

  return (
    <div
      className="container mx-auto pt-24 pb-8 px-4 max-w-4xl"
      data-testid="settings-page"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" data-testid="profile-tab">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your profile information is managed by your OAuth provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={user?.image || ""}
                      alt={user?.name || ""}
                    />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      placeholder="Enter display name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      This is how your name will be displayed across the platform
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email is managed by your OAuth provider and cannot be changed here
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    data-testid="save-profile-button"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card data-testid="subscription-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Current plan:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        isTierLoading
                          ? "text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                      data-testid="tier-badge"
                      data-tier={isTierLoading
                        ? undefined
                        : (currentTier || "FREE")}
                    >
                      {isTierLoading ? "Loading..." : (currentTier || "FREE")}
                    </span>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    data-testid="manage-subscription-button"
                  >
                    <Link href="/settings/subscription">
                      Manage Subscription
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api-keys" data-testid="api-keys-tab">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="preferences" data-testid="preferences-tab">
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Customize how you want to interact with Spike Land
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account activity
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="email-notifications-switch"
                />
              </div>

              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for important updates
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  data-testid="push-notifications-switch"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" data-testid="privacy-tab">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control how others can see and interact with your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="public-profile">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  id="public-profile"
                  checked={publicProfile}
                  onCheckedChange={setPublicProfile}
                  data-testid="public-profile-switch"
                />
              </div>

              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="show-activity">Show Activity Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you&apos;re online
                  </p>
                </div>
                <Switch
                  id="show-activity"
                  checked={showActivity}
                  onCheckedChange={setShowActivity}
                  data-testid="show-activity-switch"
                />
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data
                </p>

                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      data-testid="delete-account-button"
                    >
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="delete-dialog">
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and
                        remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        data-testid="cancel-delete-button"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        data-testid="confirm-delete-button"
                      >
                        Delete Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}
    >
      <SettingsPageContent />
    </Suspense>
  );
}
