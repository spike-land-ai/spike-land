"use client";

import { AuthButtons } from "@/components/auth/auth-buttons";
import { PixelLogo } from "@/components/brand/PixelLogo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tryCatch } from "@/lib/try-catch";
import type { ConnectionStatusResponse } from "@/lib/validations/agent";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  FolderOpen,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";

interface ConnectionContentProps {
  connectId: string;
  status:
    | "pending"
    | "authenticated"
    | "expired"
    | "not_found"
    | "connecting"
    | "connected";
  displayName?: string;
  projectPath?: string;
  expiresAt?: string;
  error?: string;
}

export function ConnectionContent({
  connectId,
  status: initialStatus,
  displayName,
  projectPath,
  expiresAt,
  error,
}: ConnectionContentProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState(error);

  // Connect the agent when user is authenticated
  const connectAgent = useCallback(async () => {
    setIsConnecting(true);
    setConnectError(undefined);

    const { data, error: fetchError } = await tryCatch(
      fetch(`/api/ai/connect/${connectId}`, {
        method: "PUT",
      }).then(r => r.json()),
    );

    if (fetchError || !data?.success) {
      setConnectError(data?.error || "Failed to connect agent");
      setIsConnecting(false);
      return;
    }

    setStatus("connected");

    // Redirect to agent page after a brief delay
    setTimeout(() => {
      router.push(`/agents/${data.agentId}`);
    }, 1500);
  }, [connectId, router]);

  // Poll for connection status when pending (for QR code flow)
  useEffect(() => {
    if (status !== "pending") return;

    const pollInterval = setInterval(async () => {
      const { data } = await tryCatch(
        fetch(`/api/ai/connect/${connectId}`).then(r =>
          r.json() as Promise<ConnectionStatusResponse>
        ),
      );

      if (data?.status === "connected" && data.agentId) {
        clearInterval(pollInterval);
        setStatus("connected");
        router.push(`/agents/${data.agentId}`);
      } else if (data?.status === "expired") {
        clearInterval(pollInterval);
        setStatus("expired");
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [connectId, status, router]);

  // Calculate time remaining
  const getTimeRemaining = useCallback(() => {
    if (!expiresAt) return null;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return "Expired";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [expiresAt]);

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt || status === "connected" || status === "expired") return;

    const timer = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
      if (remaining === "Expired") {
        setStatus("expired");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, status, getTimeRemaining]);

  // Get the current URL for QR code
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="flex justify-center mb-2">
              <PixelLogo size="lg" variant="horizontal" />
            </div>

            {/* Status icon */}
            <div className="flex justify-center">
              {status === "connected"
                ? (
                  <div className="rounded-full bg-aurora-green/10 p-4">
                    <CheckCircle2 className="h-12 w-12 text-aurora-green" />
                  </div>
                )
                : status === "expired" || status === "not_found"
                ? (
                  <div className="rounded-full bg-destructive/10 p-4">
                    <XCircle className="h-12 w-12 text-destructive" />
                  </div>
                )
                : isConnecting
                ? (
                  <div className="rounded-full bg-primary/10 p-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                )
                : (
                  <div className="rounded-full bg-primary/10 p-4">
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                {status === "connected"
                  ? "Agent Connected!"
                  : status === "expired"
                  ? "Connection Expired"
                  : status === "not_found"
                  ? "Connection Not Found"
                  : isConnecting
                  ? "Connecting..."
                  : "Connect Claude Code Agent"}
              </CardTitle>
              <CardDescription className="text-base">
                {status === "connected"
                  ? "Redirecting to your agent..."
                  : status === "expired"
                  ? "Please run the agent script again"
                  : status === "not_found"
                  ? "The connection request was not found"
                  : isConnecting
                  ? "Setting up your agent connection"
                  : status === "authenticated"
                  ? "Click below to connect this agent to your account"
                  : "Sign in to connect this agent"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-8 space-y-6">
            {/* Error display */}
            {connectError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectError}</AlertDescription>
              </Alert>
            )}

            {/* Agent info */}
            {displayName && status !== "expired" && status !== "not_found" && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{displayName}</span>
                </div>
                {projectPath && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    <span className="truncate">{projectPath}</span>
                  </div>
                )}
                {timeRemaining && status === "pending" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expires in {timeRemaining}</span>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated: Show connect button */}
            {status === "authenticated" && !isConnecting && (
              <Button
                onClick={connectAgent}
                className="w-full"
                size="lg"
              >
                <Bot className="mr-2 h-5 w-5" />
                Connect Agent
              </Button>
            )}

            {/* Pending: Show QR code and sign in */}
            {status === "pending" && (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm text-muted-foreground text-center">
                    Scan this QR code with your phone to sign in
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={currentUrl}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or sign in here
                    </span>
                  </div>
                </div>

                <AuthButtons className="w-full" />
              </>
            )}

            {/* Connected: Show success message */}
            {status === "connected" && (
              <div className="text-center text-sm text-muted-foreground">
                <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                Redirecting to your agent dashboard...
              </div>
            )}

            {/* Expired/Not Found: Show retry message */}
            {(status === "expired" || status === "not_found") && (
              <div className="text-center text-sm text-muted-foreground">
                Run the agent connection script again to generate a new connection request.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
