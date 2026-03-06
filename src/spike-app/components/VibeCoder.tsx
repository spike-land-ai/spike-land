import {
  lazy,
  Suspense,
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import {
  Send,
  Code2,
  Eye,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Sparkles,
  Trash2,
  X,
  GripVertical,
  Loader2,
  MonitorPlay,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { cn } from "@/shared/utils/cn";
import { useChat } from "@/hooks/useChat";
import { useBrowserBridge } from "@/hooks/useBrowserBridge";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/hooks/useAuth";
import { AiChatMessage } from "@/components/AiChatMessage";
import { LivePreview } from "@/components/LivePreview";
import { Button } from "@/shared/ui/button";

// Lazy-load the Monaco-based code editor to keep initial bundle small
const CodeEditor = lazy(() =>
  import("@/components/CodeEditor").then((m) => ({ default: m.CodeEditor })),
);

export interface VibeCoderProps {
  initialCode?: string;
  appId?: string;
}

type MobilePanel = "chat" | "code" | "preview";

const DEFAULT_CODE = `import React from "react";

export default function App() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-700">
      <h1 className="text-4xl font-bold text-white">Hello, world!</h1>
    </div>
  );
}
`;

// ---------------------------------------------------------------------------
// Resizable divider
// ---------------------------------------------------------------------------

interface DividerProps {
  onDrag: (deltaX: number) => void;
  isDarkMode: boolean;
}

function ResizeDivider({ onDrag, isDarkMode }: DividerProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onDrag(delta);
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onDrag]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panels"
      onMouseDown={onMouseDown}
      className={cn(
        "hidden md:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors group select-none",
        isDarkMode
          ? "bg-white/5 hover:bg-white/10 active:bg-[#ffaa00]/30"
          : "bg-border hover:bg-border/70 active:bg-primary/20",
      )}
    >
      <GripVertical
        className={cn(
          "w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity",
          isDarkMode ? "text-gray-500" : "text-muted-foreground",
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat panel
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  isDarkMode: boolean;
  className?: string;
}

function ChatPanel({ isDarkMode, className }: ChatPanelProps) {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();
  const { messages, sendMessage, isStreaming, error, clearError, clearMessages, submitBrowserResult } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [authWarning, setAuthWarning] = useState(false);

  useBrowserBridge({ messages, onResult: submitBrowserResult, router });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    if (!isAuthenticated) {
      setAuthWarning(true);
      setTimeout(() => setAuthWarning(false), 4000);
      return;
    }
    sendMessage(input);
    setInput("");
  }, [input, isStreaming, isAuthenticated, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden",
        isDarkMode ? "bg-[#0a0a0b]" : "bg-card",
        className,
      )}
    >
      {/* Panel header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b shrink-0",
          isDarkMode ? "border-white/5 bg-white/3" : "border-border bg-muted/40",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isDarkMode ? "bg-[#00ffaa] animate-pulse" : "bg-green-500",
              )}
            />
            {isDarkMode && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00ffaa] animate-ping opacity-30" />
            )}
          </div>
          <span
            className={cn(
              "text-xs font-bold tracking-tight",
              isDarkMode ? "text-white" : "text-foreground",
            )}
          >
            AI Agent
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isDarkMode
                ? "hover:bg-white/5 text-gray-500 hover:text-red-400"
                : "hover:bg-muted text-muted-foreground hover:text-destructive",
            )}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto p-4", isDarkMode && "nice-scrollbar")}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-50 px-6">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                isDarkMode ? "bg-white/5" : "bg-muted",
              )}
            >
              <Sparkles
                className={cn("w-7 h-7", isDarkMode ? "text-[#ffaa00]" : "text-primary")}
              />
            </div>
            <div className="space-y-1.5">
              <p
                className={cn(
                  "text-sm font-bold",
                  isDarkMode ? "text-white" : "text-foreground",
                )}
              >
                Start coding with AI
              </p>
              <p
                className={cn(
                  "text-xs leading-relaxed max-w-[220px]",
                  isDarkMode ? "text-gray-500" : "text-muted-foreground",
                )}
              >
                Describe what you want to build and the AI will write and update the code for you.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg) => (
            <AiChatMessage key={msg.id} message={msg} />
          ))}
        </div>
      </div>

      {/* Auth warning */}
      {authWarning && (
        <div
          className={cn(
            "mx-4 mb-3 px-3 py-2.5 rounded-xl text-xs font-semibold flex justify-between items-center gap-3 shrink-0",
            isDarkMode
              ? "bg-[#ffaa00]/10 border border-[#ffaa00]/20 text-[#ffaa00]"
              : "bg-amber-50 border border-amber-200 text-amber-800",
          )}
        >
          <span className="flex-1">Sign in to chat with the AI agent.</span>
          <button
            onClick={() => login()}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shrink-0",
              isDarkMode
                ? "bg-[#ffaa00] text-[#020203] hover:bg-[#ffcc44]"
                : "bg-amber-500 text-white hover:bg-amber-600",
            )}
          >
            Sign in
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className={cn(
            "mx-4 mb-3 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0",
            isDarkMode
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-red-50 border border-red-200 text-red-700",
          )}
        >
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            className={cn(
              "p-1 rounded-md transition-colors shrink-0",
              isDarkMode ? "hover:bg-white/5" : "hover:bg-red-100",
            )}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div
        className={cn(
          "p-3 border-t shrink-0",
          isDarkMode ? "border-white/5 bg-white/3" : "border-border bg-muted/20",
        )}
      >
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl p-2 transition-all",
            isDarkMode
              ? "bg-white/5 border border-white/10 focus-within:ring-1 ring-[#ffaa00]/30"
              : "bg-background border border-border focus-within:ring-2 focus-within:ring-ring/30",
          )}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAuthenticated
                ? "Describe a change or ask a question..."
                : "Sign in to chat with AI..."
            }
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-none outline-none px-2 py-2 text-sm resize-none max-h-40 font-medium",
              "placeholder:opacity-50",
              isDarkMode
                ? "text-white placeholder:text-gray-600"
                : "text-foreground placeholder:text-muted-foreground",
            )}
            style={{ minHeight: "40px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            className={cn(
              "p-2.5 rounded-lg transition-all active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed shrink-0",
              isDarkMode
                ? "bg-[#ffaa00] text-[#020203]"
                : "bg-primary text-primary-foreground",
            )}
          >
            {isStreaming ? (
              <div
                className={cn(
                  "w-4 h-4 border-2 rounded-full animate-spin",
                  isDarkMode
                    ? "border-[#020203]/20 border-t-[#020203]"
                    : "border-primary-foreground/20 border-t-primary-foreground",
                )}
              />
            ) : (
              <Send className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code panel
// ---------------------------------------------------------------------------

interface CodePanelProps {
  code: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  className?: string;
}

function CodePanel({ code, onChange, isDarkMode, className }: CodePanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden",
        isDarkMode ? "bg-[#0d0d0e]" : "bg-background",
        className,
      )}
    >
      {/* Panel header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b shrink-0",
          isDarkMode ? "border-white/5 bg-white/3" : "border-border bg-muted/40",
        )}
      >
        <Code2
          className={cn("w-3.5 h-3.5", isDarkMode ? "text-[#ffaa00]" : "text-primary")}
        />
        <span
          className={cn(
            "text-xs font-bold tracking-tight",
            isDarkMode ? "text-white" : "text-foreground",
          )}
        >
          Code Editor
        </span>
        <span
          className={cn(
            "ml-auto text-[10px] font-medium uppercase tracking-widest",
            isDarkMode ? "text-gray-600" : "text-muted-foreground/60",
          )}
        >
          TSX
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center gap-3">
              <Loader2
                className={cn(
                  "w-5 h-5 animate-spin",
                  isDarkMode ? "text-[#ffaa00]" : "text-primary",
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isDarkMode ? "text-gray-500" : "text-muted-foreground",
                )}
              >
                Loading editor...
              </span>
            </div>
          }
        >
          <CodeEditor value={code} onChange={onChange} />
        </Suspense>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview panel
// ---------------------------------------------------------------------------

interface PreviewPanelProps {
  appId?: string;
  code: string;
  isDarkMode: boolean;
  className?: string;
}

function PreviewPanel({ appId, code, isDarkMode, className }: PreviewPanelProps) {
  // Build a simple HTML page for inline preview when no appId is given
  const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <pre style="padding:1rem;white-space:pre-wrap;word-break:break-all;font-size:0.8rem;color:#6b7280;">${code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>
</body>
</html>`;

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden",
        isDarkMode ? "bg-[#0a0a0b]" : "bg-background",
        className,
      )}
    >
      {/* Panel header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b shrink-0",
          isDarkMode ? "border-white/5 bg-white/3" : "border-border bg-muted/40",
        )}
      >
        <Eye
          className={cn("w-3.5 h-3.5", isDarkMode ? "text-[#00ffaa]" : "text-green-600")}
        />
        <span
          className={cn(
            "text-xs font-bold tracking-tight",
            isDarkMode ? "text-white" : "text-foreground",
          )}
        >
          Live Preview
        </span>
        {appId && (
          <span
            className={cn(
              "ml-auto text-[10px] font-mono font-medium px-2 py-0.5 rounded border",
              isDarkMode
                ? "text-gray-500 border-white/5 bg-white/3"
                : "text-muted-foreground border-border bg-muted",
            )}
          >
            {appId}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {appId ? (
          <LivePreview appId={appId} />
        ) : code.trim() ? (
          // Inline sandboxed preview of the raw source (useful before a run)
          <iframe
            title="Inline code preview"
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50 px-6 text-center">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                isDarkMode ? "bg-white/5" : "bg-muted",
              )}
            >
              <MonitorPlay
                className={cn("w-7 h-7", isDarkMode ? "text-[#00ffaa]" : "text-green-600")}
              />
            </div>
            <div className="space-y-1.5">
              <p
                className={cn(
                  "text-sm font-bold",
                  isDarkMode ? "text-white" : "text-foreground",
                )}
              >
                No preview yet
              </p>
              <p
                className={cn(
                  "text-xs leading-relaxed max-w-[220px]",
                  isDarkMode ? "text-gray-500" : "text-muted-foreground",
                )}
              >
                Write some code or chat with the AI agent to see a live preview here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile tab bar
// ---------------------------------------------------------------------------

interface MobileTabBarProps {
  active: MobilePanel;
  onChange: (panel: MobilePanel) => void;
  isDarkMode: boolean;
}

const MOBILE_TABS: { id: MobilePanel; label: string; Icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", Icon: MessageSquare },
  { id: "code", label: "Code", Icon: Code2 },
  { id: "preview", label: "Preview", Icon: Eye },
];

function MobileTabBar({ active, onChange, isDarkMode }: MobileTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="VibeCoder panels"
      className={cn(
        "flex md:hidden border-b shrink-0",
        isDarkMode ? "bg-[#0a0a0b] border-white/5" : "bg-card border-border",
      )}
    >
      {MOBILE_TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`vibecoder-panel-${id}`}
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors",
              isActive
                ? isDarkMode
                  ? "text-[#ffaa00] border-b-2 border-[#ffaa00]"
                  : "text-primary border-b-2 border-primary"
                : isDarkMode
                ? "text-gray-500 hover:text-gray-300"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop panel visibility toggles
// ---------------------------------------------------------------------------

interface PanelToggleBarProps {
  chatVisible: boolean;
  previewVisible: boolean;
  onToggleChat: () => void;
  onTogglePreview: () => void;
  isDarkMode: boolean;
}

function PanelToggleBar({
  chatVisible,
  previewVisible,
  onToggleChat,
  onTogglePreview,
  isDarkMode,
}: PanelToggleBarProps) {
  const btnBase = cn(
    "p-1.5 rounded-lg transition-all",
    isDarkMode
      ? "text-gray-500 hover:text-white hover:bg-white/5"
      : "text-muted-foreground hover:text-foreground hover:bg-muted",
  );

  return (
    <div
      className={cn(
        "hidden md:flex items-center gap-1 px-3 py-2 border-b shrink-0",
        isDarkMode ? "bg-[#070708] border-white/5" : "bg-muted/30 border-border",
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleChat}
        className={cn(btnBase, "gap-1.5 h-7 px-2.5 text-xs")}
        title={chatVisible ? "Hide chat panel" : "Show chat panel"}
      >
        {chatVisible ? (
          <PanelLeftClose className="w-3.5 h-3.5" />
        ) : (
          <MessageSquare className="w-3.5 h-3.5" />
        )}
        Chat
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onTogglePreview}
        className={cn(btnBase, "ml-auto gap-1.5 h-7 px-2.5 text-xs")}
        title={previewVisible ? "Hide preview panel" : "Show preview panel"}
      >
        Preview
        {previewVisible ? (
          <PanelRightClose className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VibeCoder — main layout component
// ---------------------------------------------------------------------------

const MIN_PANEL_WIDTH = 240; // px
const DEFAULT_CHAT_WIDTH = 320; // px
const DEFAULT_PREVIEW_WIDTH = 400; // px

export function VibeCoder({ initialCode = DEFAULT_CODE, appId }: VibeCoderProps) {
  const { isDarkMode } = useDarkMode();
  const [code, setCode] = useState(initialCode);
  const [activePanel, setActivePanel] = useState<MobilePanel>("chat");
  const [chatVisible, setChatVisible] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);

  // Panel widths controlled by drag (desktop only)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_PREVIEW_WIDTH);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleChatDrag = useCallback((deltaX: number) => {
    setChatWidth((w) => Math.max(MIN_PANEL_WIDTH, w + deltaX));
  }, []);

  const handlePreviewDrag = useCallback((deltaX: number) => {
    setPreviewWidth((w) => Math.max(MIN_PANEL_WIDTH, w - deltaX));
  }, []);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full w-full overflow-hidden",
        isDarkMode ? "bg-[#070708] text-gray-100" : "bg-background text-foreground",
      )}
    >
      {/* Desktop panel toggle toolbar */}
      <PanelToggleBar
        chatVisible={chatVisible}
        previewVisible={previewVisible}
        onToggleChat={() => setChatVisible((v) => !v)}
        onTogglePreview={() => setPreviewVisible((v) => !v)}
        isDarkMode={isDarkMode}
      />

      {/* Mobile tab switcher */}
      <MobileTabBar active={activePanel} onChange={setActivePanel} isDarkMode={isDarkMode} />

      {/* Panel area */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---- CHAT PANEL (desktop: left sidebar) ---- */}
        {chatVisible && (
          <>
            <div
              id="vibecoder-panel-chat"
              role="tabpanel"
              aria-label="Chat panel"
              style={{ width: chatWidth, minWidth: MIN_PANEL_WIDTH }}
              className={cn(
                "shrink-0 overflow-hidden border-r",
                // On mobile show only when activePanel === "chat"
                activePanel === "chat" ? "flex flex-col flex-1 md:flex-none" : "hidden md:flex md:flex-col",
                isDarkMode ? "border-white/5" : "border-border",
              )}
            >
              <ChatPanel isDarkMode={isDarkMode} className="h-full" />
            </div>
            {/* Divider between chat and code */}
            <ResizeDivider onDrag={handleChatDrag} isDarkMode={isDarkMode} />
          </>
        )}

        {/* ---- CODE PANEL (center) ---- */}
        <div
          id="vibecoder-panel-code"
          role="tabpanel"
          aria-label="Code editor panel"
          className={cn(
            "flex-1 overflow-hidden min-w-0",
            activePanel === "code" ? "flex flex-col" : "hidden md:flex md:flex-col",
          )}
        >
          <CodePanel
            code={code}
            onChange={handleCodeChange}
            isDarkMode={isDarkMode}
            className="h-full"
          />
        </div>

        {/* ---- PREVIEW PANEL (desktop: right sidebar) ---- */}
        {previewVisible && (
          <>
            {/* Divider between code and preview */}
            <ResizeDivider onDrag={handlePreviewDrag} isDarkMode={isDarkMode} />
            <div
              id="vibecoder-panel-preview"
              role="tabpanel"
              aria-label="Live preview panel"
              style={{ width: previewWidth, minWidth: MIN_PANEL_WIDTH }}
              className={cn(
                "shrink-0 overflow-hidden border-l",
                activePanel === "preview" ? "flex flex-col flex-1 md:flex-none" : "hidden md:flex md:flex-col",
                isDarkMode ? "border-white/5" : "border-border",
              )}
            >
              <PreviewPanel
                {...(appId != null ? { appId } : {})}
                code={code}
                isDarkMode={isDarkMode}
                className="h-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
