import { useCallback, useRef, useState } from "react";
import { Check, Download, Loader2, Trash2, X } from "lucide-react";
import { cn } from "../../../styling/cn";
import { useInstall } from "../../hooks/useInstall";

// ---------------------------------------------------------------------------
// Uninstall confirmation dialog
// ---------------------------------------------------------------------------

interface UninstallDialogProps {
  appName: string;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function UninstallDialog({
  appName,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: UninstallDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when opened for keyboard accessibility
  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && isOpen) {
        cancelRef.current?.focus();
      }
    },
    [isOpen],
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="uninstall-dialog-title"
      aria-describedby="uninstall-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        role="presentation"
      />

      {/* Panel */}
      <div
        ref={handleRef}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
          <Trash2 className="size-5 text-destructive" />
        </div>

        <h2
          id="uninstall-dialog-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Uninstall {appName}?
        </h2>
        <p id="uninstall-dialog-desc" className="mt-2 text-sm text-muted-foreground">
          This will remove the app from your installed list. You can reinstall it at any time.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Keep
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Uninstall
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InstallButton
// ---------------------------------------------------------------------------

export interface InstallButtonProps {
  /** The app slug to install/uninstall. */
  slug: string;
  /** The human-readable app name (used in the confirmation dialog). */
  appName: string;
  /** Visual size variant. Defaults to "default". */
  size?: "sm" | "default";
  /** Additional class names applied to the root button element. */
  className?: string;
}

/**
 * Self-contained install/uninstall button for a store app.
 *
 * - Shows "GET" when not installed, transitions to a checkmark on success.
 * - Shows an uninstall confirmation dialog before removing.
 * - Applies optimistic UI updates via {@link useInstall}.
 * - Accessible: keyboard operable, ARIA roles, focus management.
 */
export function InstallButton({ slug, appName, size = "default", className }: InstallButtonProps) {
  const { isInstalled, isInstalling, isUninstalling, install, uninstall, isStatusLoading } =
    useInstall(slug);

  const [showConfirm, setShowConfirm] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleInstall = useCallback(async () => {
    if (isInstalling || isUninstalling) return;
    await install();
    setJustInstalled(true);
    // Reset the "just installed" flash after 2 s
    setTimeout(() => setJustInstalled(false), 2000);
  }, [install, isInstalling, isUninstalling]);

  const handleUninstallRequest = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  }, []);

  const handleConfirmUninstall = useCallback(async () => {
    await uninstall();
    setShowConfirm(false);
  }, [uninstall]);

  const handleCancelUninstall = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const isBusy = isInstalling || isUninstalling || isStatusLoading;

  const sm = size === "sm";
  const baseClasses = sm
    ? "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200"
    : "rounded-full px-5 py-2 text-sm font-bold transition-all duration-200";

  if (isInstalled) {
    return (
      <>
        <button
          type="button"
          onClick={handleUninstallRequest}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleUninstallRequest(e);
          }}
          disabled={isBusy}
          aria-label={`Uninstall ${appName}`}
          aria-pressed="true"
          className={cn(
            baseClasses,
            "inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-60",
            className,
          )}
        >
          {isUninstalling ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Removing…</span>
            </>
          ) : (
            <>
              <Check className="size-3.5" />
              <span>Installed</span>
            </>
          )}
        </button>

        <UninstallDialog
          appName={appName}
          isOpen={showConfirm}
          isLoading={isUninstalling}
          onConfirm={() => void handleConfirmUninstall()}
          onCancel={handleCancelUninstall}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      disabled={isBusy}
      aria-label={`Install ${appName}`}
      aria-pressed="false"
      className={cn(
        baseClasses,
        justInstalled
          ? "inline-flex items-center gap-1.5 bg-primary text-primary-foreground"
          : "inline-flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {isInstalling ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Installing…</span>
        </>
      ) : justInstalled ? (
        <>
          <Check className="size-3.5" />
          <span>Installed</span>
        </>
      ) : (
        <>
          <Download className="size-3.5" />
          <span>GET</span>
        </>
      )}
    </button>
  );
}
