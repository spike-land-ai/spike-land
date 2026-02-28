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
import { ErrorBoundary } from "@/components/errors/error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  Bug,
  FileWarning,
  Home,
  RefreshCw,
  Search,
  ServerCrash,
  ShieldX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

const BuggyComponent = () => {
  throw new Error("This is a simulated error!");
};

const ErrorTrigger = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    return <BuggyComponent />;
  }

  return (
    <div className="flex flex-col gap-4 items-start">
      <p className="text-sm text-muted-foreground">
        Click the button below to crash this part of the UI and see the Error Boundary in action.
        The error is caught and a recovery UI is shown instead of a blank screen.
      </p>
      <Button variant="destructive" onClick={() => setShouldError(true)}>
        <Bug className="h-4 w-4 mr-2" />
        Trigger Error
      </Button>
    </div>
  );
};

function ErrorPageLayout404() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center w-full">
      <div className="relative">
        <span className="text-8xl font-black font-heading text-muted-foreground/80 drop-shadow-sm">
          404
        </span>
        <Search className="absolute -bottom-2 -right-4 h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold font-heading text-foreground">
          Page not found
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The page you are looking for does not exist, or it may have been moved. Check the URL or
          navigate back to a known location.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Go Back
        </Button>
        <Button size="sm">
          <Home className="h-4 w-4 mr-1.5" />
          Home
        </Button>
      </div>
    </div>
  );
}

function ErrorPageLayout500() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center w-full">
      <div className="p-5 rounded-full bg-destructive/10 border border-destructive/20">
        <ServerCrash className="h-12 w-12 text-destructive" strokeWidth={1.5} />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold font-heading text-foreground">
          Internal Server Error
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Something went wrong on our end. Our team has been notified and is working to fix the
          issue. Please try again shortly.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Retry
        </Button>
        <Button size="sm">
          <Home className="h-4 w-4 mr-1.5" />
          Home
        </Button>
      </div>
    </div>
  );
}

function ErrorPageLayout403() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center w-full">
      <div className="p-5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
        <ShieldX className="h-12 w-12 text-yellow-500" strokeWidth={1.5} />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold font-heading text-foreground">
          Access Denied
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You do not have permission to view this page. If you believe this is a mistake, contact
          your administrator or try logging in with a different account.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Go Back
        </Button>
        <Button size="sm">
          Sign In
        </Button>
      </div>
    </div>
  );
}

function NetworkErrorDemo() {
  const [isOffline, setIsOffline] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOffline(v => !v)}
        className="gap-2"
      >
        {isOffline
          ? <WifiOff className="h-4 w-4" />
          : <Wifi className="h-4 w-4" />}
        {isOffline ? "Simulate Online" : "Simulate Offline"}
      </Button>

      {isOffline && (
        <Alert className="border-yellow-500/40 bg-yellow-500/5 animate-in fade-in slide-in-from-top-2">
          <WifiOff className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-600 dark:text-yellow-400">
            Connection Lost
          </AlertTitle>
          <AlertDescription>
            You appear to be offline. Changes will be saved locally and synced when your connection
            is restored.
          </AlertDescription>
        </Alert>
      )}

      {!isOffline && (
        <div className="text-xs text-muted-foreground text-center">
          Toggle the button above to simulate an offline state and see the network error alert.
        </div>
      )}
    </div>
  );
}

function InlineErrorDemo() {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <div className="space-y-2">
        <label
          htmlFor="email-demo"
          className="text-sm font-medium text-foreground"
        >
          Email address
        </label>
        <div className="relative">
          <input
            id="email-demo"
            type="email"
            placeholder="you@example.com"
            aria-invalid={hasError}
            aria-describedby={hasError ? "email-error" : undefined}
            className={`w-full px-3 py-2 rounded-lg border text-sm bg-background transition-colors ${
              hasError
                ? "border-destructive focus:ring-destructive/50"
                : "border-border focus:ring-primary/50"
            } focus:outline-none focus:ring-2`}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
          )}
        </div>
        {hasError && (
          <p
            id="email-error"
            className="text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1"
            role="alert"
          >
            Please enter a valid email address.
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setHasError(v => !v)}
        className="self-start"
      >
        {hasError ? "Clear Error" : "Show Validation Error"}
      </Button>
    </div>
  );
}

const codeSnippets = {
  errorBoundary: `import { ErrorBoundary } from "@/components/errors/error-boundary";

{/* Basic usage */}
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

{/* With custom fallback */}
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <MyComponent />
</ErrorBoundary>

{/* With error callback and dev details */}
<ErrorBoundary
  onError={(error, info) => logToService(error, info)}
  showDetails={true}
>
  <MyComponent />
</ErrorBoundary>

{/* With reset keys (re-renders on key change) */}
<ErrorBoundary resetKeys={[userId, pageId]}>
  <UserProfile id={userId} />
</ErrorBoundary>`,
  errorPage: `{/* 404 Page */}
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="text-8xl font-black text-muted-foreground/20">404</span>
      <h2 className="text-xl font-bold">Page not found</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        The page you are looking for does not exist.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}

{/* 500 Page */}
export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <ServerCrash className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}`,
  inlineValidation: `{/* Inline field validation */}
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email address
  </label>
  <div className="relative">
    <input
      id="email"
      type="email"
      aria-invalid={hasError}
      aria-describedby={hasError ? "email-error" : undefined}
      className={\`w-full px-3 py-2 rounded-lg border text-sm
        \${hasError ? "border-destructive" : "border-border"}\`}
    />
    {hasError && (
      <AlertCircle className="absolute right-3 top-1/2
        -translate-y-1/2 h-4 w-4 text-destructive" />
    )}
  </div>
  {hasError && (
    <p id="email-error" className="text-xs text-destructive" role="alert">
      Please enter a valid email address.
    </p>
  )}
</div>`,
  networkError: `{/* Network connectivity alert */}
function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="border-yellow-500/40 bg-yellow-500/5">
      <WifiOff className="h-4 w-4 text-yellow-500" />
      <AlertTitle>Connection Lost</AlertTitle>
      <AlertDescription>
        Changes will be saved locally and synced when back online.
      </AlertDescription>
    </Alert>
  );
}`,
};

export default function ErrorsPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Errors"
        description="Error boundaries, error page layouts, inline validation, and network error patterns for graceful failure handling."
        usage="Use error boundaries to prevent full-page crashes. Use error page layouts for HTTP status codes. Use inline validation for form fields and network alerts for connectivity issues."
      />

      <UsageGuide
        dos={[
          "Wrap major UI sections in error boundaries to isolate failures.",
          "Provide actionable recovery options (retry, go home, go back).",
          "Use friendly, human-readable error messages -- not stack traces.",
          "Show inline validation errors directly next to the relevant field.",
          "Log errors to a monitoring service (e.g., Sentry) in production.",
          "Use appropriate HTTP status code pages (404, 403, 500) for server errors.",
          "Provide offline-aware UI that queues changes for sync.",
        ]}
        donts={[
          "Don't show raw error messages or stack traces to end users.",
          "Don't let a single component crash take down the entire page.",
          "Don't use error pages for validation feedback -- use inline errors.",
          "Don't silently swallow errors without logging them.",
          "Don't block navigation when an error occurs -- always offer a way out.",
          "Don't use alert dialogs for recoverable form errors.",
        ]}
      />

      {/* 1. Error Boundary Demo */}
      <ComponentSample
        title="Error Boundary"
        description="Catches JavaScript errors anywhere in the child component tree and displays a recovery UI instead of crashing the entire page."
      >
        <div className="w-full max-w-lg">
          <ErrorBoundary>
            <ErrorTrigger />
          </ErrorBoundary>
        </div>
      </ComponentSample>

      {/* 2. Error Boundary with Custom Fallback */}
      <ComponentSample
        title="Error Boundary with Custom Fallback"
        description="Pass a custom fallback component for branded error recovery UI."
      >
        <div className="w-full max-w-lg">
          <ErrorBoundary
            fallback={
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <FileWarning className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        Widget Failed to Load
                      </CardTitle>
                      <CardDescription>
                        This component encountered an unexpected error.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Reload Page
                  </Button>
                </CardFooter>
              </Card>
            }
          >
            <BuggyComponent />
          </ErrorBoundary>
        </div>
      </ComponentSample>

      {/* 3. Error Page Layouts */}
      <ComponentSample
        title="404 - Page Not Found"
        description="A friendly 404 page layout with navigation options to recover from a missing page."
      >
        <ErrorPageLayout404 />
      </ComponentSample>

      <ComponentSample
        title="500 - Internal Server Error"
        description="Server error page layout with retry and home navigation for unrecoverable server failures."
      >
        <ErrorPageLayout500 />
      </ComponentSample>

      <ComponentSample
        title="403 - Access Denied"
        description="Permission denied page layout guiding users to authenticate or navigate away."
      >
        <ErrorPageLayout403 />
      </ComponentSample>

      {/* 4. Network Error Pattern */}
      <ComponentSample
        title="Network Connectivity Error"
        description="An alert pattern for offline/connectivity issues with local-save messaging. Toggle to simulate."
      >
        <NetworkErrorDemo />
      </ComponentSample>

      {/* 5. Inline Validation Error */}
      <ComponentSample
        title="Inline Field Validation"
        description="Form-level validation errors shown directly next to the field with ARIA attributes for screen reader support."
      >
        <InlineErrorDemo />
      </ComponentSample>

      {/* Code Snippets */}
      <CodePreview
        code={codeSnippets.errorBoundary}
        title="Usage Examples"
        tabs={[
          { label: "Error Boundary", code: codeSnippets.errorBoundary },
          { label: "Error Pages", code: codeSnippets.errorPage },
          { label: "Inline Validation", code: codeSnippets.inlineValidation },
          { label: "Network Error", code: codeSnippets.networkError },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Error boundary recovery UI includes focusable action buttons (Try again, Go home).",
          "Error page layouts use semantic heading hierarchy (h1 for title).",
          "Inline validation errors use aria-invalid and aria-describedby for programmatic association.",
          "Validation error messages use role='alert' for immediate screen reader announcement.",
          "Network alert uses the Alert component which includes role='alert' by default.",
          "All error icons are decorative (aria-hidden); text conveys the meaning.",
          "Recovery actions (retry, go back, go home) are keyboard accessible.",
          "Focus is managed to the error message or recovery UI when errors appear.",
          "Color is never the sole indicator of error state -- icons and text always accompany it.",
        ]}
      />

      <RelatedComponents currentId="errors" />
    </div>
  );
}
