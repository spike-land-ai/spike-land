"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Bot,
  MessageSquare,
  RefreshCw,
  Settings,
  User,
} from "lucide-react";
import type { AgentMessage, MessageRole } from "./types";

interface MessageLogProps {
  messages: AgentMessage[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ROLE_CONFIG: Record<MessageRole, {
  icon: React.ReactNode;
  label: string;
  containerClass: string;
  labelClass: string;
}> = {
  USER: {
    icon: <User className="w-3.5 h-3.5" />,
    label: "User",
    containerClass: "bg-blue-950/20 border-blue-500/20",
    labelClass: "text-blue-400",
  },
  AGENT: {
    icon: <Bot className="w-3.5 h-3.5" />,
    label: "Agent",
    containerClass: "bg-violet-950/20 border-violet-500/20",
    labelClass: "text-violet-400",
  },
  SYSTEM: {
    icon: <Settings className="w-3.5 h-3.5" />,
    label: "System",
    containerClass: "bg-zinc-900 border-zinc-700",
    labelClass: "text-zinc-400",
  },
};

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isPriorityTask(content: string): boolean {
  return content.startsWith("[TASK:");
}

function extractPriority(content: string): string | null {
  const match = /\[TASK:([A-Z]+)\]/.exec(content);
  return match?.[1] ?? null;
}

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  LOW: "bg-zinc-800 text-zinc-400 border-zinc-700",
  MEDIUM: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/30",
};

interface MessageItemProps {
  message: AgentMessage;
}

function MessageItem({ message }: MessageItemProps) {
  const config = ROLE_CONFIG[message.role];
  const isTask = isPriorityTask(message.content);
  const priority = isTask ? extractPriority(message.content) : null;
  const cleanContent = isTask
    ? message.content.replace(/^\[TASK:[A-Z]+\]\s*/, "")
    : message.content;

  return (
    <div
      className={`rounded-lg border p-3 transition-opacity ${config.containerClass} ${
        message.isRead ? "opacity-70" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={config.labelClass}>{config.icon}</span>
          <span className={`text-[10px] font-bold ${config.labelClass}`}>
            {config.label}
          </span>
          {message.agentName && (
            <span className="text-[10px] text-zinc-600">
              — {message.agentName}
            </span>
          )}
          {isTask && priority && (
            <Badge
              variant="outline"
              className={`text-[9px] px-1 py-0 ${
                PRIORITY_BADGE_CLASS[priority] ?? PRIORITY_BADGE_CLASS.MEDIUM
              }`}
            >
              {priority}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!message.isRead && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-violet-500"
              aria-label="Unread"
            />
          )}
          <span className="text-[10px] text-zinc-600 font-mono">
            {formatTimestamp(message.createdAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
        {cleanContent}
      </p>
    </div>
  );
}

export function MessageLog(
  { messages, isLoading, onRefresh }: MessageLogProps,
) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-zinc-300">Message Log</span>
          {unreadCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/30"
            >
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
          onClick={onRefresh}
          aria-label="Refresh messages"
          disabled={isLoading}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1 -mr-1 pr-1">
        {messages.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-600">No messages yet</p>
              <p className="text-[10px] text-zinc-700 mt-1">
                Messages from agents will appear here
              </p>
            </div>
          )
          : (
            <div className="space-y-2 pb-2">
              {messages.map(msg => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
      </ScrollArea>
    </div>
  );
}
