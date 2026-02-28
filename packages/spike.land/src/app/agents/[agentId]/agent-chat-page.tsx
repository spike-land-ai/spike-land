"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ToolCallCard } from "@/components/chat/ToolCallCard";
import { type AgentMessage, useAgentChat } from "@/hooks/useAgentChat";
import { tryCatch } from "@/lib/try-catch";
import { cn } from "@/lib/utils";
import type { AgentResponse } from "@/lib/validations/agent";
import {
  Activity,
  ArrowLeft,
  Bot,
  Clock,
  Code2,
  FolderOpen,
  Send,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const statusConfig = {
  online: {
    label: "Online",
    variant: "success" as const,
    dotClass: "bg-aurora-green animate-pulse",
  },
  sleeping: {
    label: "Sleeping",
    variant: "warning" as const,
    dotClass: "bg-aurora-yellow",
  },
  offline: {
    label: "Offline",
    variant: "outline" as const,
    dotClass: "bg-gray-400",
  },
};

interface AgentChatPageProps {
  agent: AgentResponse;
}

export function AgentChatPage({ agent }: AgentChatPageProps) {
  const [status, setStatus] = useState(agent.status);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newMessage, setNewMessage] = useState("");

  const statusInfo = statusConfig[status];

  const {
    messages,
    isStreaming,
    currentTurn,
    maxTurns,
    error,
    sendMessage,
  } = useAgentChat(
    `agent-${agent.id}`,
    "/api/agent-loop",
    { route: `/agents/${agent.id}` },
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Poll for status updates
  useEffect(() => {
    const statusInterval = setInterval(async () => {
      const { data } = await tryCatch(
        fetch(`/api/agents/${agent.id}`).then(r => r.json()),
      );

      if (data?.status) {
        setStatus(data.status);
      }
    }, 10000);

    return () => clearInterval(statusInterval);
  }, [agent.id]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || isStreaming) return;
    const msg = newMessage.trim();
    setNewMessage("");
    await sendMessage(msg);
    textareaRef.current?.focus();
  }, [newMessage, isStreaming, sendMessage]);

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate time since last seen
  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      {/* Agent info header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Status indicator */}
              <div className="relative">
                <div
                  className={cn("h-4 w-4 rounded-full", statusInfo.dotClass)}
                />
                {status === "online" && (
                  <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-aurora-green/50" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">{agent.displayName}</CardTitle>
                <CardDescription className="text-sm">
                  {agent.machineId.slice(0, 8)}:{agent.sessionId.slice(0, 8)}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project info */}
          {agent.projectPath && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{agent.projectPath}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last seen: {getTimeSince(agent.lastSeenAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>{agent.totalTasksCompleted} tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <Code2 className="h-3 w-3" />
              <span>{agent.totalTokensUsed.toLocaleString()} tokens</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-col h-[60vh]">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            {isStreaming && currentTurn > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wrench className="h-3 w-3" />
                Turn {currentTurn}/{maxTurns}
              </span>
            )}
          </div>
        </CardHeader>

        {/* Messages list */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0
              ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Send a message to start the conversation.
                </div>
              )
              : messages.map(message => <AgentMessageBubble key={message.id} message={message} />)}
          </div>
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder={status === "offline"
                ? "Agent is offline. Messages will be delivered when it reconnects."
                : "Type a message..."}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isStreaming}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}

function AgentMessageBubble({ message }: { message: AgentMessage; }) {
  const isUser = message.role === "user";
  const textContent = message.blocks
    .filter(b => b.type === "text")
    .map(b => b.type === "text" ? b.content : "")
    .join("");
  const toolBlocks = message.blocks.filter(b => b.type === "tool_call");
  const hasContent = textContent || toolBlocks.length > 0;

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-2")}>
        {/* Text content */}
        {textContent && (
          <div
            className={cn(
              "rounded-lg px-4 py-2",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{textContent}</p>
          </div>
        )}

        {/* Tool calls */}
        {toolBlocks.map(block =>
          block.type === "tool_call"
            ? <ToolCallCard key={block.id} block={block} />
            : null
        )}

        {/* Loading indicator */}
        {!hasContent && !isUser && (
          <div className="rounded-lg px-4 py-2 bg-muted">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: "0.4s" }}
              />
            </span>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            "text-[10px]",
            isUser
              ? "text-right text-muted-foreground"
              : "text-muted-foreground",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
