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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Bell,
  BellDot,
  CheckCircle2,
  Info,
  Loader2,
  PackageOpen,
  Plus,
  Terminal,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function InlineFeedbackDemo() {
  const [saved, setSaved] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleError() {
    setErrored(true);
    setTimeout(() => setErrored(false), 1500);
  }

  async function handleLoad() {
    setLoading(true);
    setLoadSuccess(false);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setLoadSuccess(true);
    setTimeout(() => setLoadSuccess(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      {/* Success checkmark */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleSave}>
          Save changes
        </Button>
        <span
          className={`flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 transition-all duration-300 ${
            saved ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          }`}
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4" />
          Saved!
        </span>
      </div>

      {/* Error with shake */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleError}
          className={errored
            ? "animate-shake border-destructive text-destructive"
            : ""}
        >
          Submit invalid
        </Button>
        <span
          className={`flex items-center gap-1.5 text-sm text-destructive transition-all duration-300 ${
            errored ? "opacity-100" : "opacity-0"
          }`}
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4" />
          Please check the form
        </span>
      </div>

      {/* Loading -> Success transition */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading
            ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            )
            : "Upload file"}
        </Button>
        {loadSuccess && (
          <span
            className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4" />
            Upload complete
          </span>
        )}
      </div>
    </div>
  );
}

function NotificationStack() {
  const notifications = [
    {
      id: 1,
      title: "New message",
      body: "Alex sent you a file",
      icon: Bell,
      color: "text-primary",
    },
    {
      id: 2,
      title: "Build succeeded",
      body: "deploy/main passed all checks",
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      id: 3,
      title: "Storage warning",
      body: "You're at 90% of your quota",
      icon: TriangleAlert,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="relative h-36 w-full max-w-sm">
      {notifications.map((n, i) => {
        const Icon = n.icon;
        const offset = (notifications.length - 1 - i) * 8;
        const scale = 1 - (notifications.length - 1 - i) * 0.04;
        return (
          <div
            key={n.id}
            className="absolute inset-x-0 top-0 bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-md"
            style={{
              transform: `translateY(${offset}px) scale(${scale})`,
              zIndex: i + 1,
            }}
          >
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${n.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {n.body}
              </p>
            </div>
            <button
              aria-label="Dismiss notification"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function EmptyStateCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-border rounded-2xl text-center w-full max-w-sm">
      <div className="p-4 rounded-full bg-muted/60">
        <PackageOpen
          className="h-10 w-10 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">No items found</p>
        <p className="text-sm text-muted-foreground">
          Get started by creating your first item.
        </p>
      </div>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-1.5" />
        Create item
      </Button>
    </div>
  );
}

function NotificationBadgeDemo() {
  const [count, setCount] = useState(3);

  return (
    <div className="flex flex-col gap-6 w-full max-w-md items-center">
      <div className="flex gap-6 items-center">
        {/* Icon with numeric badge */}
        <div className="flex flex-col items-center gap-2">
          <button
            className="relative p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
            aria-label={`Notifications: ${count} unread`}
            onClick={() => setCount(c => Math.max(0, c - 1))}
          >
            <Bell className="h-5 w-5 text-foreground" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                {count}
              </span>
            )}
          </button>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Numeric
          </span>
        </div>

        {/* Dot indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative p-2.5 rounded-xl bg-muted/60">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Dot
          </span>
        </div>

        {/* BellDot icon variant */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-2.5 rounded-xl bg-muted/60">
            <BellDot className="h-5 w-5 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Icon
          </span>
        </div>

        {/* Badge with text */}
        <div className="flex flex-col items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Inbox
            <Badge className="h-5 px-1.5 text-[10px] leading-none">12</Badge>
          </Button>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Inline
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Click the numeric badge to decrement the count and see zero-state handling.
      </p>
    </div>
  );
}

function InteractiveToastDemo() {
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  function triggerPromise() {
    setLastTriggered("promise");
    const promise = new Promise<{ name: string; }>(resolve =>
      setTimeout(() => resolve({ name: "Project Alpha" }), 2000)
    );
    toast.promise(promise, {
      loading: "Deploying project...",
      success: data => `${data.name} deployed successfully!`,
      error: "Deployment failed",
    });
  }

  function triggerAction() {
    setLastTriggered("action");
    toast("File moved to trash", {
      action: {
        label: "Undo",
        onClick: () => toast.info("File restored"),
      },
    });
  }

  function triggerDescription() {
    setLastTriggered("description");
    toast("Event Created", {
      description: "Team standup has been scheduled for Monday at 10:00 AM.",
    });
  }

  function triggerCustom() {
    setLastTriggered("custom");
    toast.custom(() => (
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 shadow-lg w-[356px]">
        <div className="p-2 rounded-full bg-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Custom Toast</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fully custom JSX rendered inside sonner.
          </p>
        </div>
      </div>
    ));
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <Button
          variant="outline"
          size="sm"
          className={lastTriggered === "promise"
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : ""}
          onClick={triggerPromise}
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Promise Toast
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={lastTriggered === "action"
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : ""}
          onClick={triggerAction}
        >
          Action Toast (Undo)
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={lastTriggered === "description"
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : ""}
          onClick={triggerDescription}
        >
          With Description
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={lastTriggered === "custom"
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
            : ""}
          onClick={triggerCustom}
        >
          Custom JSX Toast
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        These demos showcase advanced toast patterns: async promise tracking, undo actions,
        descriptions, and fully custom JSX.
      </p>
    </div>
  );
}

const toastButtons = [
  {
    label: "Success",
    variant: "outline" as const,
    className: "border-green-500/50 hover:bg-green-500/10 text-green-600 dark:text-green-400",
    icon: <CheckCircle2 className="h-4 w-4" />,
    action: () => toast.success("Changes saved successfully"),
  },
  {
    label: "Error",
    variant: "outline" as const,
    className: "border-destructive/50 hover:bg-destructive/10 text-destructive",
    icon: <AlertCircle className="h-4 w-4" />,
    action: () => toast.error("Something went wrong"),
  },
  {
    label: "Info",
    variant: "outline" as const,
    className: "border-primary/50 hover:bg-primary/10 text-primary",
    icon: <Info className="h-4 w-4" />,
    action: () => toast.info("New update available"),
  },
  {
    label: "Warning",
    variant: "outline" as const,
    className: "border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    icon: <TriangleAlert className="h-4 w-4" />,
    action: () => toast.warning("Low storage remaining"),
  },
  {
    label: "Default",
    variant: "outline" as const,
    className: "",
    icon: <Terminal className="h-4 w-4" />,
    action: () => toast("Event has been created"),
  },
] as const;

const alertVariants = [
  {
    className: "",
    icon: Terminal,
    iconClass: "",
    title: "Default",
    desc: "General information or system status message.",
  },
  {
    className: "border-primary/40 bg-primary/5",
    icon: Info,
    iconClass: "text-primary",
    title: "Info",
    desc: "Your enhancement is being processed. This may take a few moments.",
  },
  {
    className: "border-green-500/40 bg-green-500/5",
    icon: CheckCircle2,
    iconClass: "text-green-500",
    title: "Success",
    desc: "Your image has been enhanced successfully. View it in your gallery.",
  },
  {
    className: "border-yellow-500/40 bg-yellow-500/5",
    icon: TriangleAlert,
    iconClass: "text-yellow-500",
    title: "Warning",
    desc: "Your token balance is running low. Consider purchasing more tokens.",
  },
  {
    variant: "destructive" as const,
    icon: AlertCircle,
    iconClass: "",
    title: "Error",
    desc: "Failed to process image. Please try again or contact support.",
  },
];

const codeSnippets = {
  toast: `import { toast } from "sonner";

// Basic variants
toast.success("Changes saved successfully");
toast.error("Something went wrong");
toast.info("New update available");
toast.warning("Low storage remaining");
toast("Event has been created");

// Promise-based toast (auto-tracks async state)
toast.promise(fetchData(), {
  loading: "Loading data...",
  success: (data) => \`Loaded \${data.count} items\`,
  error: "Failed to load data",
});

// Toast with action button
toast("File moved to trash", {
  action: {
    label: "Undo",
    onClick: () => restoreFile(),
  },
});

// Toast with description
toast("Event Created", {
  description: "Team standup scheduled for Monday at 10:00 AM.",
});`,
  alert: `import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

{/* Default */}
<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Default</AlertTitle>
  <AlertDescription>General information message.</AlertDescription>
</Alert>

{/* Destructive */}
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>

{/* Custom styled (info, success, warning) */}
<Alert className="border-green-500/40 bg-green-500/5">
  <CheckCircle2 className="h-4 w-4 text-green-500" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Operation completed.</AlertDescription>
</Alert>`,
  inline: `function InlineFeedback() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}>
        Save changes
      </Button>
      <span
        className={\`flex items-center gap-1.5 text-sm text-green-600
          transition-all duration-300 \${saved ? "opacity-100" : "opacity-0"}\`}
        aria-live="polite"
      >
        <CheckCircle2 className="h-4 w-4" />
        Saved!
      </span>
    </div>
  );
}`,
  badge: `{/* Numeric badge on icon */}
<button className="relative p-2.5 rounded-xl bg-muted/60">
  <Bell className="h-5 w-5" />
  <span className="absolute -top-1 -right-1 flex items-center justify-center
    min-w-[18px] h-[18px] px-1 rounded-full bg-destructive
    text-destructive-foreground text-[10px] font-bold">
    3
  </span>
</button>

{/* Dot indicator */}
<div className="relative p-2.5 rounded-xl bg-muted/60">
  <Bell className="h-5 w-5" />
  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5
    rounded-full bg-primary ring-2 ring-background" />
</div>

{/* Inline badge in button */}
<Button variant="outline" size="sm">
  <Bell className="h-4 w-4" />
  Inbox
  <Badge className="h-5 px-1.5 text-[10px]">12</Badge>
</Button>`,
};

export default function FeedbackPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Feedback"
        description="Toast notifications, alerts, inline feedback patterns, and notification badges for communicating system state and user actions."
        usage="Use toasts for transient, non-blocking messages. Use alerts for persistent, in-page feedback that requires user attention. Use notification badges to indicate unread counts."
      />

      <UsageGuide
        dos={[
          "Use toasts for transient confirmations (save, delete, copy).",
          "Keep toast messages under 60 characters.",
          "Use alert variant='destructive' for blocking errors only.",
          "Provide a call-to-action in empty states to guide the user.",
          "Animate state transitions so changes are noticeable.",
          "Use promise-based toasts for async operations to track loading state.",
          "Include an undo action in toasts for destructive operations.",
        ]}
        donts={[
          "Don't stack more than 3 toasts at once.",
          "Don't use error toasts for validation -- use inline feedback instead.",
          "Don't auto-dismiss alerts that require user action.",
          "Don't rely solely on color to convey feedback state.",
          "Don't use notification badges for non-actionable information.",
          "Don't combine multiple feedback types for the same event.",
        ]}
      />

      {/* 1. Interactive Toast Demo -- Basic Variants */}
      <ComponentSample
        title="Toast Notifications"
        description="Click each button to trigger the corresponding toast variant via sonner."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {toastButtons.map(btn => (
            <Card
              key={btn.label}
              className="flex flex-col items-center p-5 gap-3 text-center"
            >
              <div className="p-2.5 rounded-full bg-muted/60">
                {btn.icon}
              </div>
              <div>
                <p className="text-sm font-semibold">{btn.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  toast.{btn.label.toLowerCase()}(...)
                </p>
              </div>
              <Button
                variant={btn.variant}
                size="sm"
                className={btn.className}
                onClick={btn.action}
              >
                Trigger {btn.label}
              </Button>
            </Card>
          ))}
        </div>
      </ComponentSample>

      {/* 2. Advanced Toast Patterns */}
      <ComponentSample
        title="Advanced Toast Patterns"
        description="Promise-based toasts, action buttons, descriptions, and fully custom JSX rendered inside sonner."
      >
        <InteractiveToastDemo />
      </ComponentSample>

      {/* 3. Alert Variants Grid */}
      <ComponentSample
        title="Alert Variants"
        description="All five alert variants for persistent in-page feedback."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {alertVariants.map(av => {
            const Icon = av.icon;
            return (
              <Alert
                key={av.title}
                variant={av.variant}
                className={av.className}
              >
                <Icon className={`h-4 w-4 ${av.iconClass}`} />
                <AlertTitle>{av.title}</AlertTitle>
                <AlertDescription>{av.desc}</AlertDescription>
              </Alert>
            );
          })}
        </div>
      </ComponentSample>

      {/* 4. Notification Badge Demo */}
      <ComponentSample
        title="Notification Badges"
        description="Numeric badges, dot indicators, icon variants, and inline badges for unread counts and status indicators."
      >
        <NotificationBadgeDemo />
      </ComponentSample>

      {/* 5. Inline Feedback Patterns */}
      <ComponentSample
        title="Inline Feedback Patterns"
        description="Success checkmark, error shake, and loading-to-success transitions."
      >
        <InlineFeedbackDemo />
      </ComponentSample>

      {/* 6. Empty State Pattern */}
      <ComponentSample
        title="Empty State"
        description='"No items found" pattern with an illustration-style icon and a call-to-action.'
      >
        <EmptyStateCard />
      </ComponentSample>

      {/* 7. Notification Stack */}
      <ComponentSample
        title="Notification Stack"
        description="Stacked notification cards with slight depth offset to imply a queue."
      >
        <NotificationStack />
      </ComponentSample>

      {/* Semantic Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic State Colors</CardTitle>
          <CardDescription>
            Color utility tokens for success, warning, and error states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <p className="text-success font-medium">Success State</p>
              <p className="text-xs text-muted-foreground mt-1">
                bg-success, border-success
              </p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-warning font-medium">Warning State</p>
              <p className="text-xs text-muted-foreground mt-1">
                bg-warning, border-warning
              </p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-destructive font-medium">Error State</p>
              <p className="text-xs text-muted-foreground mt-1">
                bg-destructive/10
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.toast}
        title="Usage Examples"
        tabs={[
          { label: "Toast", code: codeSnippets.toast },
          { label: "Alert", code: codeSnippets.alert },
          { label: "Inline", code: codeSnippets.inline },
          { label: "Badges", code: codeSnippets.badge },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Toast messages are announced via aria-live='polite' by sonner.",
          "Destructive toasts use aria-live='assertive' for urgency.",
          "Alert components use role='alert' by default.",
          "Inline feedback elements include aria-live regions.",
          "Loading states disable interactive elements and convey progress.",
          "Icons are decorative (aria-hidden); text carries the semantic meaning.",
          "Shake animation respects prefers-reduced-motion via Tailwind.",
          "Notification dismiss buttons have descriptive aria-label attributes.",
          "Notification badges use aria-label to convey count to screen readers.",
          "Custom toast JSX should include appropriate ARIA roles.",
        ]}
      />

      <RelatedComponents currentId="feedback" />

      {/* Shake keyframe -- injected locally to avoid global CSS changes */}
      <style>
        {`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-shake { animation: none; }
        }
      `}
      </style>
    </div>
  );
}
