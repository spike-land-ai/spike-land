import { useCallback, useEffect, useRef } from "react";
import { MessageSquare, X } from "lucide-react";
import { useChatContext } from "./ChatProvider";
import { ChatPanel } from "./ChatPanel";

// ---------------------------------------------------------------------------
// Notification badge
// ---------------------------------------------------------------------------

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
      className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm ring-2 ring-background"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ChatWidget
// ---------------------------------------------------------------------------

interface ChatWidgetProps {
  /** Called when the grid icon in the chat panel header is clicked. */
  onOpenAppDrawer?: () => void;
}

export function ChatWidget({ onOpenAppDrawer }: ChatWidgetProps) {
  const { isPanelOpen, openPanel, closePanel, togglePanel, unreadCount, markAllRead } =
    useChatContext();

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click-outside (only when panel is open and NOT expanded)
  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (!isPanelOpen) return;
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        closePanel();
      }
    },
    [isPanelOpen, closePanel],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [handleDocumentClick]);

  // Mark messages read when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      markAllRead();
    }
  }, [isPanelOpen, markAllRead]);

  // Keyboard: Escape to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPanelOpen) {
        closePanel();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPanelOpen, closePanel]);

  return (
    <div className="fixed bottom-16 right-16 z-[9990] flex flex-col items-end gap-3">
      {/* Chat panel — slides up from the button */}
      <div
        ref={panelRef}
        className={`origin-bottom-right transition-all duration-300 ease-out ${
          isPanelOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        aria-hidden={!isPanelOpen}
      >
        {/* Always render so state is preserved, visibility controlled above */}
        <ChatPanel onOpenAppDrawer={onOpenAppDrawer} />
      </div>

      {/* Floating trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePanel}
        aria-label={isPanelOpen ? "Close Spike Chat" : "Open Spike Chat"}
        aria-expanded={isPanelOpen}
        aria-haspopup="dialog"
        className="relative flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-xl ring-2 ring-background transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
      >
        {/* Icon: X when open, chat bubble when closed */}
        <span
          className={`absolute transition-all duration-200 ${
            isPanelOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"
          }`}
          aria-hidden="true"
        >
          <X className="size-5" />
        </span>
        <span
          className={`absolute transition-all duration-200 ${
            isPanelOpen ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
          }`}
          aria-hidden="true"
        >
          <MessageSquare className="size-5" />
        </span>

        {/* Unread badge */}
        <UnreadBadge count={unreadCount} />
      </button>
    </div>
  );
}
