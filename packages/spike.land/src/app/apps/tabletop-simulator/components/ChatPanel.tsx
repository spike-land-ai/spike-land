"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameMessage } from "@apps/tabletop-simulator/types/message";

interface ChatPanelProps {
  messages: GameMessage[];
  localPlayerId: string | null;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  className?: string;
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export function ChatPanel({
  messages,
  localPlayerId,
  onSendMessage,
  disabled = false,
  className,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setDraft("");
    inputRef.current?.focus();
  }, [draft, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Card
      className={[
        "bg-white/5 border-white/10 backdrop-blur-sm flex flex-col",
        className ?? "",
      ].join(" ")}
    >
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-indigo-400" />
          Chat
          {messages.length > 0 && (
            <span className="ml-auto text-xs text-zinc-500 font-normal">
              {messages.length} messages
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 min-h-0 flex-1 pb-4">
        {/* Message list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-64 pr-1">
          {messages.length === 0
            ? (
              <div className="flex flex-col items-center justify-center h-16 gap-1 text-zinc-600">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">No messages yet</span>
              </div>
            )
            : (
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isLocal = msg.playerId === localPlayerId;
                  const isEvent = msg.type === "event";

                  if (isEvent) {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                      >
                        <span className="text-[10px] text-zinc-600 italic px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                          {msg.playerName} {msg.content}
                        </span>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={[
                        "flex flex-col gap-0.5",
                        isLocal ? "items-end" : "items-start",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: msg.playerColor }}
                        >
                          {isLocal ? "You" : msg.playerName}
                        </span>
                        <span className="text-[9px] text-zinc-600">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={[
                          "max-w-[85%] px-3 py-1.5 rounded-xl text-xs leading-relaxed break-words",
                          isLocal
                            ? "bg-indigo-600/80 text-white rounded-tr-sm"
                            : "bg-white/10 text-zinc-200 rounded-tl-sm",
                        ].join(" ")}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <Input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Connecting..." : "Say something..."}
            disabled={disabled}
            maxLength={300}
            className="bg-black/40 border-white/10 text-sm focus-visible:ring-indigo-500/50 disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim() || disabled}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-3 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
