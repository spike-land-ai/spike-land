import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { MessageCircle, X, Send, Trash2, Sparkles } from "lucide-react";
import { useChat } from "../../hooks/useChat";
import { ChatMessage } from "./ChatMessage";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isStreaming, error, clearError, clearMessages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-8 right-6 md:right-8 z-[120] w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 group ${
          open
            ? "bg-obsidian-800 hover:bg-obsidian-700 rotate-90 scale-90"
            : "bg-amber-neon hover:bg-amber-neon shadow-[0_0_30px_rgba(255,170,0,0.4)] scale-100 hover:scale-110 active:scale-95"
        }`}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />
        ) : (
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-obsidian-950 stroke-[2.5]" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-[calc(8rem+env(safe-area-inset-bottom))] md:bottom-24 right-4 md:right-8 z-[120] w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] md:h-[600px] max-h-[60dvh] md:max-h-[80dvh] flex flex-col glass-panel rounded-[2rem] border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] transition-all duration-500 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-10 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 rounded-t-[2rem]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-neon animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-neon animate-ping opacity-20" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 leading-none mb-1">Neural Partner</span>
              <h3 className="text-xs font-bold text-white tracking-tight leading-none uppercase">Studio Intelligence</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-all active:scale-90"
                title="Wipe Memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 nice-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-neon" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white tracking-tight uppercase">How shall we evolve?</p>
                <p className="text-[10px] font-medium text-gray-500 leading-relaxed max-w-[180px]">
                  I can manifest assets and orchestrate canvas workflows.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-5">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 flex justify-between items-center animate-in slide-in-from-bottom-2">
            <span className="flex-1 mr-3 uppercase tracking-tighter">{error}</span>
            <button onClick={clearError} className="p-1 hover:bg-white/5 rounded transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-white/5 rounded-b-[2rem]">
          <div className="relative flex items-end gap-2 bg-obsidian-950/50 border border-white/10 rounded-xl p-1.5 focus-within:ring-1 ring-amber-neon/30 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a creative leap..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-xs text-white placeholder:text-gray-700 resize-none max-h-32 font-medium"
              style={{ minHeight: "36px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-2.5 rounded-lg bg-amber-neon text-obsidian-950 disabled:opacity-20 disabled:grayscale transition-all active:scale-90 shadow-lg"
            >
              {isStreaming ? (
                <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
