import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { MessageCircle, X, Send, Trash2, Sparkles } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/shared/utils/cn";
import { useChat } from "@/hooks/useChat";
import { useBrowserBridge } from "@/hooks/useBrowserBridge";
import { AiChatMessage } from "@/components/AiChatMessage";

export function AiChatWidget() {
  const { isDarkMode } = useDarkMode();
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [authWarning, setAuthWarning] = useState(false);
  const { messages, sendMessage, isStreaming, error, clearError, clearMessages, submitBrowserResult } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useBrowserBridge({ messages, onResult: submitBrowserResult, router });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    if (!isAuthenticated) {
      setAuthWarning(true);
      setTimeout(() => setAuthWarning(false), 4000);
      return;
    }
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-8 right-6 md:right-8 z-50 w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 group",
          open
            ? isDarkMode
              ? "bg-zinc-800 hover:bg-zinc-700 rotate-90 scale-90"
              : "bg-muted hover:bg-muted/80 rotate-90 scale-90"
            : isDarkMode
            ? "bg-[#ffaa00] hover:bg-[#ffaa00] shadow-[0_0_30px_rgba(255,170,0,0.4)] scale-100 hover:scale-110 active:scale-95"
            : "bg-primary text-primary-foreground shadow-lg scale-100 hover:scale-110 active:scale-95",
        )}
        aria-label={open ? "Close chat" : "Open AI chat"}
      >
        {open ? (
          <X className={cn("w-5 h-5 md:w-6 md:h-6", isDarkMode ? "text-gray-300" : "text-foreground")} />
        ) : (
          <MessageCircle
            className={cn(
              "w-6 h-6 md:w-7 md:h-7 stroke-[2.5]",
              isDarkMode ? "text-[#020203]" : "text-primary-foreground",
            )}
          />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-28 right-4 md:right-8 z-50 w-[calc(100vw-2rem)] sm:w-[440px] h-[600px] md:h-[650px] max-h-[65dvh] md:max-h-[85dvh] flex flex-col transition-all duration-500 origin-bottom-right",
          isDarkMode
            ? "glass-panel rounded-[2.5rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            : "bg-card border border-border rounded-2xl shadow-lg",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10 pointer-events-none",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-8 py-6 border-b",
            isDarkMode
              ? "bg-white/5 border-white/5 rounded-t-[2.5rem]"
              : "bg-muted/50 border-border rounded-t-2xl",
          )}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  isDarkMode ? "bg-[#00ffaa] animate-pulse" : "bg-success",
                )}
              />
              {isDarkMode && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#00ffaa] animate-ping opacity-20" />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isDarkMode ? "text-gray-500" : "text-muted-foreground",
                )}
              >
                {isDarkMode ? "Neural Partner" : "AI Assistant"}
              </span>
              <h3
                className={cn(
                  "text-sm font-bold tracking-tight",
                  isDarkMode ? "text-white" : "text-foreground",
                )}
              >
                spike.land {isDarkMode ? "Intelligence" : ""}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className={cn(
                  "p-2.5 rounded-xl transition-all active:scale-90",
                  isDarkMode
                    ? "hover:bg-white/5 text-gray-500 hover:text-red-400"
                    : "hover:bg-muted text-muted-foreground hover:text-destructive",
                )}
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className={cn(
                "p-2.5 rounded-xl transition-all active:scale-90",
                isDarkMode
                  ? "hover:bg-white/5 text-gray-500 hover:text-white"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className={cn("flex-1 overflow-y-auto p-8", isDarkMode && "nice-scrollbar")}
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <div
                className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center",
                  isDarkMode ? "bg-white/5" : "bg-muted",
                )}
              >
                <Sparkles
                  className={cn("w-8 h-8", isDarkMode ? "text-[#ffaa00]" : "text-primary")}
                />
              </div>
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-sm font-bold tracking-tight",
                    isDarkMode ? "text-white" : "text-foreground",
                  )}
                >
                  How can I help you today?
                </p>
                <p
                  className={cn(
                    "text-xs font-medium leading-relaxed max-w-[200px]",
                    isDarkMode ? "text-gray-500" : "text-muted-foreground",
                  )}
                >
                  I can help you navigate spike.land, answer questions, and assist with your tasks.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {messages.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        </div>

        {/* Auth warning */}
        {authWarning && (
          <div
            className={cn(
              "mx-8 mb-4 px-4 py-3 rounded-2xl text-[11px] font-bold flex justify-between items-center gap-3",
              isDarkMode
                ? "bg-[#ffaa00]/10 border border-[#ffaa00]/20 text-[#ffaa00]"
                : "bg-warning border border-warning/30 text-warning-foreground",
            )}
          >
            <span className="flex-1">Sign in to chat with the AI assistant.</span>
            <button
              onClick={() => login()}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors",
                isDarkMode
                  ? "bg-[#ffaa00] text-[#020203] hover:bg-[#ffcc44]"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              Sign in
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className={cn(
              "mx-8 mb-4 px-4 py-3 rounded-2xl text-[11px] font-bold flex justify-between items-center",
              isDarkMode
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-destructive border border-destructive/20 text-destructive-foreground",
            )}
          >
            <span className="flex-1 mr-4">{error}</span>
            <button
              onClick={clearError}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isDarkMode ? "hover:bg-white/5" : "hover:bg-white/20",
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div
          className={cn(
            "p-6 border-t",
            isDarkMode ? "border-white/5 bg-white/5 rounded-b-[2.5rem]" : "border-border bg-muted/30 rounded-b-2xl",
          )}
        >
          <div
            className={cn(
              "relative flex items-end gap-3 rounded-2xl p-2 transition-all",
              isDarkMode
                ? "glass-panel border border-white/10 focus-within:ring-1 ring-[#ffaa00]/30"
                : "bg-card border border-border",
            )}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAuthenticated ? "Ask me anything..." : "Sign in to chat..."}
              rows={1}
              className={cn(
                "flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm resize-none max-h-32 font-medium placeholder:opacity-50",
                isDarkMode ? "text-white placeholder:text-gray-600" : "text-foreground placeholder:text-muted-foreground",
              )}
              style={{ minHeight: "44px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={cn(
                "p-3.5 rounded-xl transition-all active:scale-90 disabled:opacity-20 disabled:grayscale",
                isDarkMode
                  ? "bg-[#ffaa00] text-[#020203] shadow-[0_0_20px_rgba(255,170,0,0.2)]"
                  : "bg-primary text-primary-foreground",
              )}
              aria-label="Send message"
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
                <Send className="w-4 h-4 stroke-[3]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
