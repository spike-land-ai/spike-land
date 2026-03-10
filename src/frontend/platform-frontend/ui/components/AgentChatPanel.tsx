import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  User,
  Wrench,
  Compass,
} from "lucide-react";
import { Button } from "../shared/ui/button";
import { cn } from "../../styling/cn";
import { useAuth } from "../hooks/useAuth";
import { type ConversationItem, type ToolCallConversationItem, useChat } from "../hooks/useChat";
import { useBrowserBridge } from "../hooks/useBrowserBridge";

interface AgentChatPanelProps {
  placeholder?: string;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTokenCount(value: number) {
  if (value >= 10_000) {
    return `${Math.round(value / 1000)}k`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return `${value}`;
}

function getUsageTone(percentage: number) {
  if (percentage >= 80) {
    return {
      rail: "bg-red-100",
      fill: "bg-red-500",
      text: "text-red-700",
    };
  }

  if (percentage >= 60) {
    return {
      rail: "bg-amber-100",
      fill: "bg-amber-500",
      text: "text-amber-700",
    };
  }

  return {
    rail: "bg-emerald-100",
    fill: "bg-emerald-500",
    text: "text-emerald-700",
  };
}

const AssistantMarkdown = memo(function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1">{children}</ol>,
        code: ({ children }) => (
          <code className="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">{children}</code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

const ToolCallCard = memo(function ToolCallCard({ item }: { item: ToolCallConversationItem }) {
  const statusTone =
    item.status === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : item.status === "done"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  const StatusIcon = item.transport === "browser" ? Compass : Wrench;

  return (
    <div className="mb-4 flex w-full justify-start">
      <div className="max-w-[88%] rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <StatusIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{item.name}</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              statusTone,
            )}
          >
            {item.transport} · {item.status}
          </span>
        </div>

        <pre className="mt-3 overflow-x-auto rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
          {JSON.stringify(item.args, null, 2)}
        </pre>

        {item.result && (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
            {item.result}
          </pre>
        )}
      </div>
    </div>
  );
});

const ConversationRow = memo(function ConversationRow({ item }: { item: ConversationItem }) {
  if (item.kind === "tool_call") {
    return <ToolCallCard item={item} />;
  }

  const isUser = item.kind === "user";

  return (
    <div className={cn("mb-4 flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[88%]">
        <div
          className={cn(
            "mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em]",
            isUser ? "justify-end text-muted-foreground" : "text-primary",
          )}
        >
          {!isUser && <Bot className="size-3.5" />}
          <span>{isUser ? "User" : "Assistant"}</span>
          {isUser && <User className="size-3.5" />}
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-sm",
            isUser
              ? "rounded-tr-none bg-primary text-primary-foreground"
              : "rounded-tl-none border border-border bg-card text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
          ) : (
            <AssistantMarkdown content={item.content} />
          )}
          <p
            className={cn(
              "mt-2 text-[10px] font-medium",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground/70",
            )}
          >
            {formatTime(item.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
});

export function AgentChatPanel({
  placeholder = "Ask the agent to inspect, modify, or navigate this app...",
}: AgentChatPanelProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();
  const {
    threads,
    currentThreadId,
    items,
    usage,
    isLoadingHistory,
    isStreaming,
    error,
    sendMessage,
    selectThread,
    newThread,
    clearError,
    submitBrowserResult,
  } = useChat({ enabled: isAuthenticated });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useBrowserBridge({
    items,
    router,
    onResult: (toolCallId, result) => {
      void submitBrowserResult(toolCallId, result).catch(() => {
        // The hook already surfaces API failures through chat state.
      });
    },
  });

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [items.length, isStreaming, isLoadingHistory]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    void sendMessage(trimmed);
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
  }, [input, isStreaming, sendMessage]);

  const usagePercent = useMemo(() => {
    if (!usage || usage.contextWindow <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((usage.totalTokens / usage.contextWindow) * 100));
  }, [usage]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading chat access…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_50%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.9))] p-6">
        <div className="max-w-md rounded-[28px] border border-border bg-card/95 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquareText className="size-7 text-primary" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-foreground">Sign in to use the agent</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The persistent tool-calling chat uses your authenticated thread history and browser
            session.
          </p>
          <Button onClick={() => void login()} className="mt-6 rounded-xl px-5">
            Continue with GitHub
          </Button>
        </div>
      </div>
    );
  }

  const tone = getUsageTone(usagePercent);

  return (
    <div className="grid h-full min-h-0 bg-[linear-gradient(180deg,_rgba(248,250,252,0.9),_rgba(241,245,249,0.6))] lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-border/80 bg-card/70 backdrop-blur lg:border-b-0 lg:border-r">
        <div className="border-b border-border/70 p-4">
          <Button
            onClick={newThread}
            disabled={isStreaming}
            className="w-full justify-start rounded-xl bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="mr-2 size-4" />
            New thread
          </Button>
        </div>

        <div className="max-h-56 overflow-y-auto p-3 lg:max-h-none">
          {threads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              No saved threads yet.
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => void selectThread(thread.id)}
                disabled={isStreaming}
                className={cn(
                  "mb-2 w-full rounded-2xl border px-4 py-3 text-left transition",
                  currentThreadId === thread.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent bg-muted/40 hover:border-border hover:bg-card",
                )}
              >
                <div className="line-clamp-2 text-sm font-semibold text-foreground">
                  {thread.title}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{new Date(thread.updatedAt).toLocaleDateString()}</span>
                  {thread.usage ? <span>{formatTokenCount(thread.usage.totalTokens)}</span> : null}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col">
        <div
          ref={scrollRef}
          role="log"
          aria-label="Agent chat history"
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        >
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1">{error}</div>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-xs font-semibold uppercase tracking-wider text-red-700"
                >
                  Dismiss
                </button>
              </div>
            )}

            {items.length === 0 && !isLoadingHistory ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-white/70 px-6 py-12 text-center shadow-[0_24px_80px_rgba(15,23,42,0.04)]">
                <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
                  <Bot className="size-8 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  Persistent agent chat
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Tool calls, browser actions, and assistant output are stored per round, so this
                  thread can be reopened without losing the original sequence.
                </p>
              </div>
            ) : null}

            {items.map((item) => (
              <ConversationRow key={item.id} item={item} />
            ))}

            {(isStreaming || isLoadingHistory) && (
              <div className="mb-4 flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {isLoadingHistory ? "Loading thread…" : "Agent is thinking…"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/80 bg-card/80 p-4 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            {usage && (
              <div className="mb-4">
                <div
                  className={cn(
                    "mb-2 flex items-center justify-between text-[11px] font-semibold",
                    tone.text,
                  )}
                >
                  <span>Context window</span>
                  <span>
                    {formatTokenCount(usage.totalTokens)} / {formatTokenCount(usage.contextWindow)}{" "}
                    ({usagePercent}%)
                  </span>
                </div>
                <div className={cn("h-2 overflow-hidden rounded-full", tone.rail)}>
                  <div
                    className={cn("h-full rounded-full transition-all duration-300", tone.fill)}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={placeholder}
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />

              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="size-12 rounded-2xl shadow-lg shadow-primary/20"
              >
                {isStreaming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>

            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for a new line.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
