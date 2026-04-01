import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
} from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  CircuitBoard,
  Cloud,
  CloudOff,
  Copy,
  Loader2,
  Send,
  Trash2,
  User,
  Workflow,
  Zap,
} from "lucide-react";
import { useAetherChat, type AetherMessage, type PipelineStage } from "../hooks/useAetherChat";
import { useBrowserBridge } from "../hooks/useBrowserBridge";
import type { ConversationItem } from "../hooks/useChat";
import { ChatMarkdown } from "../components/chat/ChatMarkdown";

const STAGE_LABELS: Record<PipelineStage, string> = {
  classify: "Intent classification",
  plan: "Response planning",
  execute: "Execution and tools",
  extract: "Memory extraction",
  idle: "Ready",
};

const QUICK_PROMPTS = [
  "Map the best MCP tools for shipping a small feature.",
  "Review this product idea and turn it into a concrete execution plan.",
  "Find the weakest part of my current approach and suggest a better one.",
];

const STAGE_ORDER: PipelineStage[] = ["classify", "plan", "execute", "extract"];

const PERSONA_OPTIONS = [
  { slug: null, label: "Default" },
  { slug: "rubik-3", label: "Rubik" },
  { slug: "erdos", label: "Erdős" },
  { slug: "radix", label: "Radix" },
  { slug: "gov", label: "Gov" },
  { slug: "attila", label: "Attila" },
] as const;

type StageVisualState = "idle" | "upcoming" | "active" | "done";

function getStageVisualState(
  stage: PipelineStage,
  currentStage: PipelineStage,
  isStreaming: boolean,
  hasMessages: boolean,
): StageVisualState {
  if (!hasMessages && !isStreaming) {
    return "idle";
  }

  if (!isStreaming || currentStage === "idle") {
    return "done";
  }

  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const stageIndex = STAGE_ORDER.indexOf(stage);

  if (stageIndex < currentIndex) {
    return "done";
  }

  if (stageIndex === currentIndex) {
    return "active";
  }

  return "upcoming";
}

function formatToolResultPreview(result: string | undefined) {
  if (!result) {
    return "";
  }

  return result.length > 320 ? `${result.slice(0, 317).trimEnd()}...` : result;
}

const MessageItem = memo(function MessageItem({ msg }: { msg: AetherMessage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(msg.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  return (
    <div
      className={`group grid gap-2 ${msg.role === "user" ? "justify-items-end" : "justify-items-start"}`}
    >
      <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {msg.role === "assistant" ? (
          <>
            <Bot className="size-3.5 text-primary" />
            <span>Spike</span>
          </>
        ) : (
          <>
            <User className="size-3.5 text-muted-foreground" />
            <span>You</span>
          </>
        )}
      </div>

      <div
        className={`relative w-full max-w-[92%] rounded-2xl border px-4 py-3 shadow-sm ${
          msg.role === "user"
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-foreground"
        }`}
      >
        {msg.role === "assistant" ? (
          <ChatMarkdown content={msg.content} />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6">{msg.content}</p>
        )}

        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mt-4 grid gap-2 border-t border-border/70 pt-3">
            {msg.toolCalls.map((toolCall) => (
              <div
                key={toolCall.toolCallId}
                className="rounded-xl border border-border bg-muted/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 font-mono text-muted-foreground">
                    <Zap className="size-3 text-primary" />
                    {toolCall.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      toolCall.status === "done"
                        ? "bg-success/10 text-success-foreground"
                        : toolCall.status === "error"
                          ? "bg-destructive/10 text-destructive-foreground"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {toolCall.status}
                  </span>
                  <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {toolCall.transport}
                  </span>
                </div>
                {toolCall.result && (
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-background p-3 font-mono text-xs leading-5 text-muted-foreground">
                    {formatToolResultPreview(toolCall.result)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {msg.role === "assistant" && (
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded-lg border border-border bg-background/80 p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground"
            title="Copy response"
            type="button"
          >
            {copied ? (
              <Check className="size-3.5 text-success-foreground" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

function StageRail({
  currentStage,
  isStreaming,
  hasMessages,
}: {
  currentStage: PipelineStage;
  isStreaming: boolean;
  hasMessages: boolean;
}) {
  return (
    <div className="grid gap-2">
      {STAGE_ORDER.map((stage, index) => {
        const visualState = getStageVisualState(stage, currentStage, isStreaming, hasMessages);
        const isActive = visualState === "active";
        const isDone = visualState === "done";

        return (
          <div
            key={stage}
            className={`grid grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border px-3 py-3 ${
              isActive
                ? "border-primary bg-primary/5"
                : isDone
                  ? "border-border bg-card"
                  : "border-border bg-muted/30"
            }`}
          >
            <div
              className={`mt-0.5 flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                    ? "bg-success/10 text-success-foreground"
                    : "bg-background text-muted-foreground"
              }`}
            >
              {isDone ? <CheckCircle2 className="size-4" /> : index + 1}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{STAGE_LABELS[stage]}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isActive
                  ? "Current stage"
                  : isDone
                    ? "Completed for this turn"
                    : "Waiting for prior stage"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 py-12">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
        <Zap className="size-7" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          What can I help with?
        </h2>
        <p className="text-sm text-muted-foreground">
          Spike Chat uses the Aether pipeline — classify, plan, execute, extract — with bounded
          context and reusable memory.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 w-full max-w-2xl">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
            onClick={() => onPromptSelect(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function PersonaSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (slug: string | null) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="appearance-none rounded-full border border-border bg-card pl-3 pr-7 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
      >
        {PERSONA_OPTIONS.map((opt) => (
          <option key={opt.slug ?? "default"} value={opt.slug ?? ""}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export function SpikeChatApp() {
  const {
    messages,
    sendMessage,
    submitBrowserResult,
    isStreaming,
    currentStage,
    error,
    clearError,
    clearMessages,
    noteCount,
    totalNoteCount,
    model,
    lastLearnedLesson,
    sessionId,
    sessionReady,
    persona,
    setPersona,
  } = useAetherChat();
  const router = useRouter();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isStreaming, currentStage]);

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
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 220)}px`;
  }, []);

  const recentToolCalls = messages
    .flatMap((message) => message.toolCalls ?? [])
    .slice(-5)
    .reverse();
  const browserItems: ConversationItem[] = messages.flatMap((message) =>
    (message.toolCalls ?? []).map((toolCall) => ({
      id: `${message.id}-${toolCall.toolCallId}`,
      kind: "tool_call" as const,
      toolCallId: toolCall.toolCallId,
      name: toolCall.name,
      args: toolCall.args,
      ...(toolCall.result !== undefined ? { result: toolCall.result } : {}),
      status: toolCall.status,
      transport: toolCall.transport,
      timestamp: message.timestamp,
    })),
  );

  const hasMessages = messages.length > 0;

  useBrowserBridge({
    items: browserItems,
    router,
    onResult: (toolCallId, result) => {
      void submitBrowserResult(toolCallId, result).catch(() => {
        // The hook surfaces submission errors through the chat state.
      });
    },
  });

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 h-12">
          {/* Left: Icon + title + persona */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Zap className="size-4" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground whitespace-nowrap">
              Spike Chat
            </h1>
            <PersonaSelector value={persona} onChange={setPersona} />
          </div>

          {/* Center: Stage dots */}
          <div className="hidden sm:flex items-center gap-1.5 mx-auto">
            {STAGE_ORDER.map((stage) => {
              const currentIdx = STAGE_ORDER.indexOf(currentStage);
              const stageIdx = STAGE_ORDER.indexOf(stage);
              const isDone = isStreaming && stageIdx < currentIdx;
              const isActive = isStreaming && stageIdx === currentIdx;
              return (
                <div key={stage} className="flex items-center gap-1" title={STAGE_LABELS[stage]}>
                  {isDone ? (
                    <CheckCircle2 className="size-3 text-primary" />
                  ) : isActive ? (
                    <span className="size-3 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <span className="size-3 rounded-full bg-border" />
                  )}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider hidden md:inline ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
                  >
                    {STAGE_LABELS[stage].split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Status chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {sessionReady ? (
                <Cloud className="size-2.5 text-primary" />
              ) : (
                <CloudOff className="size-2.5" />
              )}
              {sessionReady ? "Synced" : "..."}
            </span>
            <span className="hidden lg:inline-flex rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {model ?? "Grok"}
            </span>
            <span className="hidden md:inline-flex rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {noteCount} notes
            </span>
            <button
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-destructive"
              onClick={clearMessages}
              title="Clear conversation"
              type="button"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
            <span>{error}</span>
            <button className="text-xs underline" onClick={clearError} type="button">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[1fr_280px]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Conversation log
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {isStreaming
                    ? "Streaming the current execution turn."
                    : "Ready for the next task."}
                </p>
              </div>
              <button
                className="rounded-xl border border-border bg-background p-2 text-muted-foreground transition hover:text-foreground"
                onClick={clearMessages}
                title="Clear conversation"
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div
              ref={scrollRef}
              role="log"
              aria-label="Chat history"
              className="flex-1 overflow-y-auto px-4 py-4 md:px-5"
            >
              {hasMessages ? (
                <div className="grid gap-5">
                  {messages.map((msg) => (
                    <MessageItem key={msg.id} msg={msg} />
                  ))}
                </div>
              ) : (
                <EmptyState onPromptSelect={setInput} />
              )}
            </div>

            <div className="border-t border-border bg-background/70 px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="rounded-full border border-border bg-card px-3 py-1">
                  {STAGE_LABELS[currentStage]}
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1">
                  Enter to send
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1">
                  Shift+Enter for newline
                </span>
              </div>

              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Spike to reason, search, and act."
                  rows={1}
                  className="min-h-[54px] flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
                <button
                  className="inline-flex size-[54px] shrink-0 items-center justify-center rounded-2xl bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!input.trim() || isStreaming}
                  onClick={handleSend}
                  type="button"
                >
                  {isStreaming ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto">
            <div className="grid gap-4">
              <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Workflow className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Pipeline</h2>
                </div>
                <StageRail
                  currentStage={currentStage}
                  hasMessages={hasMessages}
                  isStreaming={isStreaming}
                />
              </section>

              <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Memory</h2>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Injected now
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      {noteCount} notes in play
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Learned over time
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      {totalNoteCount} reusable notes
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Latest lesson
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {lastLearnedLesson ?? "No new lesson extracted in this session yet."}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  {sessionReady ? (
                    <Cloud className="size-4 text-success-foreground" />
                  ) : (
                    <CloudOff className="size-4 text-muted-foreground" />
                  )}
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Session</h2>
                </div>
                <div className="grid gap-2">
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {sessionReady ? "Synced with server" : "Loading session..."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Persistence
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {sessionId
                        ? "History persists across devices and page reloads via Durable Object."
                        : "Sign in to enable cross-device session persistence."}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <CircuitBoard className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Tool Feed
                  </h2>
                </div>
                <div className="grid gap-2">
                  {recentToolCalls.length > 0 ? (
                    recentToolCalls.map((toolCall) => (
                      <div
                        key={toolCall.toolCallId}
                        className="rounded-2xl border border-border bg-background p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-foreground">{toolCall.name}</span>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              toolCall.status === "done"
                                ? "bg-success/10 text-success-foreground"
                                : toolCall.status === "error"
                                  ? "bg-destructive/10 text-destructive-foreground"
                                  : "bg-primary/10 text-primary"
                            }`}
                          >
                            {toolCall.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {formatToolResultPreview(toolCall.result) || "Waiting for tool result."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
                      Tool activity appears here once the execute stage starts calling MCP tools.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
