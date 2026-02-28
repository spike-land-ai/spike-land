"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Monitor,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DeviceVerificationContentProps {
  initialUserCode?: string;
}

interface VerifyResult {
  valid: boolean;
  clientName?: string;
  expiresAt?: string;
}

export function DeviceVerificationContent({
  initialUserCode,
}: DeviceVerificationContentProps) {
  const [userCode, setUserCode] = useState(initialUserCode ?? "");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [status, setStatus] = useState<
    "idle" | "verifying" | "verified" | "approved" | "denied" | "error"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  const verify = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setStatus("verifying");
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/mcp/oauth/device/verify?user_code=${encodeURIComponent(code.trim())}`,
      );
      const data: VerifyResult = await res.json();

      if (!res.ok || !data.valid) {
        setStatus("error");
        setErrorMessage("Invalid or expired code. Please try again.");
        return;
      }

      setVerifyResult(data);
      setStatus("verified");
    } catch {
      setStatus("error");
      setErrorMessage("Failed to verify code. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (initialUserCode) {
      verify(initialUserCode);
    }
  }, [initialUserCode, verify]);

  async function handleAction(action: "approve" | "deny") {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/mcp/oauth/device/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: userCode.trim(), action }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus("error");
        setIsSubmitting(false);
        setErrorMessage(data.error || "Failed to process request.");
        return;
      }

      setStatus(action === "approve" ? "approved" : "denied");
    } catch {
      setStatus("error");
      setIsSubmitting(false);
      setErrorMessage("Failed to process request. Please try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    verify(userCode);
  }

  function formatUserCode(value: string): string {
    const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
    if (clean.length > 4) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
  }

  if (status === "approved") {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Device Authorized</h2>
            <p className="text-muted-foreground">
              You can return to your terminal. The device has been authorized and will receive
              access shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Authorization Denied</h2>
            <p className="text-muted-foreground">
              The device authorization request has been denied. You can close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Monitor className="w-12 h-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Authorize Device
          </CardTitle>
          <CardDescription>
            {status === "verified"
              ? "Confirm you want to authorize this device"
              : "Enter the code shown on your device"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {status !== "verified"
            ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    ref={codeInputRef}
                    placeholder="XXXX-XXXX"
                    value={userCode}
                    onChange={e => setUserCode(formatUserCode(e.target.value))}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={9}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={userCode.replace("-", "").length !== 8
                    || status === "verifying"}
                >
                  {status === "verifying"
                    ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    )
                    : (
                      "Verify Code"
                    )}
                </Button>
              </form>
            )
            : (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Application requesting access:
                  </p>
                  <p className="text-lg font-semibold">
                    {verifyResult?.clientName}
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-widest">
                    {userCode}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAction("deny")}
                    disabled={isSubmitting}
                  >
                    Deny
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleAction("approve")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Authorizing...
                        </>
                      )
                      : (
                        "Approve"
                      )}
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
