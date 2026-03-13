import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  ExternalLink,
  Grid2x2,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Trash2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type AetherMessage, type PipelineStage } from "../../hooks/useAetherChat";
import { useChatContext } from "./ChatProvider";

// ---------------------------------------------------------------------------
// Stage helpers (mirrors spike-chat.tsx)
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<PipelineStage, string> = {
  classify: "Classifying",
  plan: "Planning",
  execute: "Executing",
  extract: "Extracting",
  idle: "Ready",
};

const STAGE_ORDER: PipelineStage[] = ["classify", "plan", "execute", "extract"];

// ---------------------------------------------------------------------------
// Mini stage indicator (compact horizontal rail for the panel)
// ---------------------------------------------------------------------------

function StageIndicator({
  currentStage,
  isStreaming,
}: {
  currentStage: PipelineStage;
  isStreaming: boolean;
}) {
  if (!isStreaming || currentStage === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border-b border-border/50">
      <Workflow className="size-3 text-primary shrink-0" />
      <div className="flex items-center gap-1 overflow-hidden">
        {STAGE_ORDER.map((stage) => {
          const currentIdx = STAGE_ORDER.indexOf(currentStage);
          const stageIdx = STAGE_ORDER.indexOf(stage);
          const isDone = stageIdx < currentIdx;
          const isActive = stageIdx === currentIdx;

          return (
            <div
              key={stage}
              className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                isActive
                  ? "text-primary"
                  : isDone
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="size-2.5 shrink-0" />
              ) : isActive ? (
                <span className="inline-flex size-2.5 rounded-full bg-primary animate-pulse shrink-0" />
              ) : (
                <span className="inline-flex size-2.5 rounded-full bg-border shrink-0" />
              )}
              <span className="hidden sm:inline">{STAGE_LABELS[stage]}</span>
            </div>
          );
        })}
      </div>
      <span className="ml-auto text-[10px] text-primary font-medium animate-pulse whitespace-nowrap">
        {STAGE_LABELS[currentStage]}...
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

const MessageBubble = memo(function MessageBubble({ msg }: { msg: AetherMessage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(msg.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  const isUser = msg.role === "user";

  return (
    <div className={`group flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5 px-1">
        {!isUser && <Bot className="size-3 text-primary" />}
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {isUser ? "You" : "Spike"}
        </span>
      </div>

      <div
        className={`relative max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-foreground text-background rounded-tr-sm"
            : "bg-card border border-border text-foreground rounded-tl-sm"
        }`}
      >
        {msg.content ? (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Thinking...</span>
          </span>
        )}

        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
            {msg.toolCalls.map((tc) => (
              <span
                key={tc.toolCallId}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ${
                  tc.status === "done"
                    ? "bg-success/10 text-success-foreground"
                    : tc.status === "error"
                      ? "bg-destructive/10 text-destructive-foreground"
                      : "bg-primary/10 text-primary"
                }`}
              >
                <Zap className="size-2.5 shrink-0" />
                {tc.name}
                {tc.status === "pending" && <Loader2 className="size-2.5 animate-spin" />}
                {tc.status === "done" && <Check className="size-2.5" />}
              </span>
            ))}
          </div>
        )}

        {!isUser && msg.content && (
          <button
            onClick={handleCopy}
            type="button"
            title="Copy response"
            className="absolute -right-1 -top-1 rounded-lg border border-border bg-background/90 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          >
            {copied ? <Check className="size-2.5 text-primary" /> : <Copy className="size-2.5" />}
          </button>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  /** Called when the user clicks the grid/drawer icon in the header. */
  onOpenAppDrawer?: () => void;
}

export function ChatPanel({ onOpenAppDrawer }: ChatPanelProps) {
  const {
    messages,
    sendMessage,
    isStreaming,
    currentStage,
    error,
    clearError,
    clearMessages,
    sessionReady,
    closePanel,
  } = useChatContext();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isStreaming]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    void sendMessage(trimmed);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 ${
        isExpanded
          ? "fixed inset-4 z-[9999] rounded-3xl"
          : "w-[400px] max-h-[600px] min-h-[500px]"
      }`}
      role="dialog"
      aria-label="Spike Chat"
      aria-modal="false"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-card/80 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Zap className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground leading-none">
              Spike Chat
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              {sessionReady ? (
                <>
                  <Cloud className="size-2.5 text-primary" />
                  <span>Session synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="size-2.5" />
                  <span>Connecting...</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* App Drawer trigger */}
          {onOpenAppDrawer && (
            <button
              type="button"
              onClick={onOpenAppDrawer}
              title="Open App Drawer"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Grid2x2 className="size-4" />
            </button>
          )}

          {/* Expand to full page link */}
          <Link
            to="/rubik"
            title="Open full Spike Chat"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-4" />
          </Link>

          {/* Expand/collapse panel */}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? "Restore size" : "Expand chat"}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          {/* Clear messages */}
          {hasMessages && (
            <button
              type="button"
              onClick={clearMessages}
              title="Clear conversation"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          )}

          {/* Close / minimize to widget */}
          <button
            type="button"
            onClick={closePanel}
            title="Minimize chat"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Stage indicator */}
      <StageIndicator currentStage={currentStage} isStreaming={isStreaming} />

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-2 border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 underline underline-offset-2 hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message list */}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Chat history"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-3 py-3 space-y-4"
      >
        {hasMessages ? (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Zap className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Ask Spike anything</p>
              <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                Aether pipeline — classify, plan, execute, extract. Bounded context, reusable
                memory.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {["Find an MCP tool", "Review my approach", "Ship a feature"].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/60 px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Spike..."
            rows={1}
            aria-label="Chat message"
            className="min-h-[36px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            disabled={isStreaming}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Enter to send &middot; Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
