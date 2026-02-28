"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";

/* ── Code Snippets ──────────────────────────────────────── */

const codeSnippets = {
  authButtons: `import { AuthButtons } from "@/components/auth/auth-buttons";

// Renders all configured OAuth provider buttons
<AuthButtons />`,
  signIn: `import { SignInButton } from "@/components/auth/sign-in-button";

// Standalone sign-in trigger
<SignInButton />`,
  signOut: `import { SignOutButton } from "@/components/auth/sign-out-button";

// Standalone sign-out trigger
<SignOutButton />`,
  avatar: `import { UserAvatar } from "@/components/auth/user-avatar";

// With profile image
<UserAvatar user={{ name: "Alice Smith", image: "/avatar.jpg" }} />

// Fallback to initials
<UserAvatar user={{ name: "Bob Jones", image: null }} />

// Fallback to icon (no name)
<UserAvatar user={{ name: null, image: null }} />`,
  sessionCheck: `import { auth } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <Dashboard user={session.user} />;
}`,
};

/* ── OAuth Flow Steps Demo ──────────────────────────────── */

const oauthSteps = [
  {
    step: 1,
    label: "User clicks Sign In",
    icon: LogIn,
    description: "User initiates authentication via SignInButton or AuthButtons component.",
    status: "complete" as const,
  },
  {
    step: 2,
    label: "Provider selection",
    icon: Shield,
    description:
      "NextAuth.js presents configured OAuth providers (GitHub, Google, Facebook, Apple).",
    status: "complete" as const,
  },
  {
    step: 3,
    label: "OAuth redirect",
    icon: KeyRound,
    description: "User is redirected to the provider's consent page for authorization.",
    status: "active" as const,
  },
  {
    step: 4,
    label: "Callback & token exchange",
    icon: ShieldCheck,
    description:
      "Provider redirects back with authorization code. Server exchanges for access token.",
    status: "pending" as const,
  },
  {
    step: 5,
    label: "Session created",
    icon: UserCheck,
    description: "JWT session token is created. User is redirected to the application.",
    status: "pending" as const,
  },
];

/* ── Session State Indicator ────────────────────────────── */

function SessionStateIndicator({
  state,
}: {
  state: "authenticated" | "unauthenticated" | "loading" | "expired";
}) {
  const configs = {
    authenticated: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      label: "Authenticated",
      detail: "Session active. Token valid.",
    },
    unauthenticated: {
      icon: XCircle,
      iconColor: "text-zinc-400",
      bg: "bg-zinc-500/10 border-zinc-500/20",
      label: "Unauthenticated",
      detail: "No session. Redirect to sign-in.",
    },
    loading: {
      icon: Loader2,
      iconColor: "text-amber-500 animate-spin",
      bg: "bg-amber-500/10 border-amber-500/20",
      label: "Loading",
      detail: "Checking session status...",
    },
    expired: {
      icon: ShieldAlert,
      iconColor: "text-red-500",
      bg: "bg-red-500/10 border-red-500/20",
      label: "Session Expired",
      detail: "Token expired. Re-authentication required.",
    },
  };

  const config = configs[state];
  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${config.bg}`}
    >
      <IconComponent className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.detail}</p>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function AuthPage() {
  const [activeStep, setActiveStep] = useState(2);

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Authentication"
        description="Components for handling user authentication and identity on spike.land. Built on NextAuth.js v5 with support for GitHub, Google, Facebook, and Apple OAuth providers."
        usage="Use these components to build sign-in flows, display user identity, and manage session states throughout the application."
      />

      <UsageGuide
        dos={[
          "Use AuthButtons for the primary sign-in page to show all OAuth providers.",
          "Use SignInButton/SignOutButton for contextual auth triggers in headers or menus.",
          "Display UserAvatar wherever user identity needs to be shown (nav, comments, profiles).",
          "Always check session status server-side for protected routes.",
          "Provide graceful fallbacks when user image or name is unavailable.",
        ]}
        donts={[
          "Don't build custom OAuth flows; always use the NextAuth.js providers.",
          "Don't store sensitive tokens in client-side state or localStorage.",
          "Don't show sign-out buttons to unauthenticated users.",
          "Don't assume session exists without checking; always handle the null case.",
          "Don't display raw email addresses publicly without user consent.",
        ]}
      />

      {/* ── Auth Buttons ────────────────────────────────────── */}
      <ComponentSample
        title="Auth Buttons"
        description="The primary authentication buttons group rendering all configured OAuth providers. Place this on dedicated sign-in pages."
        code={codeSnippets.authButtons}
        importPath='import { AuthButtons } from "@/components/auth/auth-buttons"'
      >
        <div className="flex flex-wrap gap-4">
          <AuthButtons />
        </div>
      </ComponentSample>

      {/* ── Individual Buttons ──────────────────────────────── */}
      <ComponentSample
        title="Individual Buttons"
        description="Standalone sign-in and sign-out buttons for use in navigation bars, menus, or contextual UI elements."
        code={codeSnippets.signIn}
      >
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex flex-col items-center gap-3">
            <SignInButton />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Sign In
            </span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <SignOutButton />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Sign Out
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* ── User Avatar ─────────────────────────────────────── */}
      <ComponentSample
        title="User Avatar"
        description="Avatar component displaying user profile images with intelligent fallbacks. Shows initials when no image is available, and a generic user icon when neither name nor image exists."
        code={codeSnippets.avatar}
        importPath='import { UserAvatar } from "@/components/auth/user-avatar"'
      >
        <div className="flex flex-wrap gap-8 items-end">
          <div className="flex flex-col items-center gap-3">
            <UserAvatar
              user={{
                name: "Alice Smith",
                image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
              }}
            />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              With Image
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <UserAvatar
              user={{
                name: "Bob Jones",
                image: null,
              }}
            />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Initials
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <UserAvatar
              user={{
                name: null,
                image: null,
              }}
            />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Fallback
            </span>
          </div>
        </div>
      </ComponentSample>

      {/* ── OAuth Flow Steps ────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">OAuth Flow Steps</h2>
        <p className="text-muted-foreground -mt-4">
          Visual representation of the NextAuth.js OAuth authentication flow. Click a step to
          simulate the active state at each phase of the process.
        </p>

        <div className="w-full max-w-2xl mx-auto space-y-3">
          {oauthSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = index === activeStep;
            const isComplete = index < activeStep;
            const isPending = index > activeStep;

            return (
              <button
                key={step.step}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full flex items-start gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-amber-500/40 bg-amber-500/10 shadow-md shadow-amber-500/5"
                    : isComplete
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-white/10 bg-white/5 opacity-60"
                }`}
              >
                {/* Step number / status */}
                <div className="relative mt-0.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-amber-500 text-black"
                        : isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : (
                      step.step
                    )}
                  </div>
                  {/* Connector line */}
                  {index < oauthSteps.length - 1 && (
                    <div
                      className={`absolute left-1/2 top-full h-3 w-px -translate-x-1/2 ${
                        isComplete ? "bg-emerald-500/40" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <IconComponent
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? "text-amber-500"
                          : isComplete
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isPending ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <Badge className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Current
                      </Badge>
                    )}
                    {isComplete && (
                      <Badge className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Done
                      </Badge>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isPending
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Session State Indicators ────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">
          Session State Indicators
        </h2>
        <p className="text-muted-foreground -mt-4">
          Visual patterns for displaying the four possible session states. Use these indicators in
          admin dashboards, debug panels, or user account settings to communicate authentication
          status clearly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <SessionStateIndicator state="authenticated" />
          <SessionStateIndicator state="unauthenticated" />
          <SessionStateIndicator state="loading" />
          <SessionStateIndicator state="expired" />
        </div>
      </section>

      {/* ── Provider Badges ─────────────────────────────────── */}
      <ComponentSample
        title="OAuth Provider Badges"
        description="Badge indicators showing which OAuth providers a user has linked to their account. Useful in settings or admin views."
      >
        <div className="flex flex-wrap gap-3">
          {[
            { name: "GitHub", connected: true },
            { name: "Google", connected: true },
            { name: "Facebook", connected: false },
            { name: "Apple", connected: false },
          ].map(provider => (
            <div
              key={provider.name}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                provider.connected
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/10 bg-white/5 opacity-60"
              }`}
            >
              {provider.connected
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                : <XCircle className="h-3.5 w-3.5 text-zinc-500" />}
              <span
                className={provider.connected
                  ? "text-foreground"
                  : "text-muted-foreground"}
              >
                {provider.name}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-5 ${
                  provider.connected
                    ? "border-emerald-500/30 text-emerald-400"
                    : "border-white/10 text-zinc-500"
                }`}
              >
                {provider.connected ? "Connected" : "Not linked"}
              </Badge>
            </div>
          ))}
        </div>
      </ComponentSample>

      {/* ── Protected Route Pattern ─────────────────────────── */}
      <ComponentSample
        title="Protected Route Pattern"
        description="Visual mockup showing authenticated vs. unauthenticated access to protected content."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">Authorized</span>
              </div>
              <div className="rounded-lg bg-black/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    user={{
                      name: "Alice Smith",
                      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
                    }}
                  />
                  <div>
                    <p className="text-xs font-medium">Alice Smith</p>
                    <p className="text-[10px] text-muted-foreground">
                      Pro plan
                    </p>
                  </div>
                </div>
                <div className="h-2 w-3/4 rounded bg-emerald-500/20" />
                <div className="h-2 w-1/2 rounded bg-emerald-500/20" />
              </div>
              <p className="text-xs text-muted-foreground">
                Dashboard content rendered for authenticated user.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Unauthorized</span>
              </div>
              <div className="rounded-lg bg-black/20 p-4 space-y-3 flex flex-col items-center justify-center min-h-[80px]">
                <User className="h-8 w-8 text-zinc-600" />
                <p className="text-xs text-zinc-500 text-center">
                  Please sign in to access this page
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Unauthenticated users are redirected to the sign-in page.
              </p>
            </CardContent>
          </Card>
        </div>
      </ComponentSample>

      {/* ── Code Preview ────────────────────────────────────── */}
      <CodePreview
        code={codeSnippets.authButtons}
        title="Usage Examples"
        tabs={[
          { label: "AuthButtons", code: codeSnippets.authButtons },
          { label: "SignIn / SignOut", code: codeSnippets.signIn },
          { label: "UserAvatar", code: codeSnippets.avatar },
          { label: "Session Check", code: codeSnippets.sessionCheck },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "All auth buttons use semantic <button> elements with descriptive text content.",
          "OAuth provider icons are decorative and hidden from screen readers via aria-hidden.",
          "Sign-in and sign-out buttons include clear, action-oriented labels.",
          "UserAvatar provides meaningful alt text derived from the user's name.",
          "Focus indicators follow WCAG 2.1 focus-visible guidelines with primary cyan ring.",
          "Session state changes are announced to screen readers via aria-live regions.",
          "Keyboard navigation works correctly through all auth button groups.",
          "Loading states use aria-busy to communicate pending authentication to assistive tech.",
        ]}
      />

      <RelatedComponents currentId="auth" />
    </div>
  );
}
