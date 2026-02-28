"use client";

import { useSession } from "@/lib/auth/client/hooks";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

function QRVerifyContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [approvalState, setApprovalState] = useState<"idle" | "approving" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-xl font-bold">Invalid QR Code</h1>
          <p className="text-muted-foreground mt-2">This QR code is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-4">
            Please sign in on this device first, then scan the QR code again.
          </p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    setApprovalState("approving");
    try {
      const response = await fetch("/api/auth/qr/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        setApprovalState("success");
      } else {
        const data = await response.json();
        setErrorMessage((data as { error?: string; }).error || "Failed to approve");
        setApprovalState("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setApprovalState("error");
    }
  };

  if (approvalState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h1 className="text-xl font-bold">Approved!</h1>
          <p className="text-muted-foreground mt-2">
            You can now close this page. The other device will be signed in shortly.
          </p>
        </div>
      </div>
    );
  }

  if (approvalState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-xl font-bold">Error</h1>
          <p className="text-muted-foreground mt-2">{errorMessage}</p>
          <Button onClick={() => setApprovalState("idle")} className="mt-4" variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold mb-2">Approve sign-in</h1>
        <p className="text-muted-foreground mb-6">
          Approve signing in as <strong>{session.user.email || session.user.name}</strong>{" "}
          on another device?
        </p>
        <Button
          onClick={handleApprove}
          disabled={approvalState === "approving"}
          className="w-full"
          size="lg"
        >
          {approvalState === "approving"
            ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving...
              </>
            )
            : (
              "Approve sign-in"
            )}
        </Button>
      </div>
    </div>
  );
}

export default function QRVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <QRVerifyContent />
    </Suspense>
  );
}
