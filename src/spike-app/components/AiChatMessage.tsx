import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, AlertCircle, Copy, Check } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { cn } from "@/shared/utils/cn";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface AiChatMessageProps {
  message: ChatMessageType;
}

function CopyButton({ text, isUser }: { text: string; isUser: boolean }) {
  const { isDarkMode } = useDarkMode();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-lg transition-all",
        isDarkMode
          ? isUser
            ? "hover:bg-black/10 text-[#020203]/50 hover:text-[#020203]"
            : "hover:bg-white/5 text-gray-500 hover:text-gray-300"
          : isUser
          ? "hover:bg-black/10 text-primary-foreground/50 hover:text-primary-foreground"
          : "hover:bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ToolCallCard({
  tc,
}: {
  tc: NonNullable<ChatMessageType["toolCalls"]>[number];
}) {
  const { isDarkMode } = useDarkMode();
  const [expanded, setExpanded] = useState(false);
  const isImage = tc.result && /https?:\/\/.*\.(png|jpg|jpeg|webp|gif)/i.test(tc.result);
  const imageUrl = isImage
    ? tc.result!.match(/https?:\/\/[^\s"]+\.(png|jpg|jpeg|webp|gif)/i)?.[0]
    : null;

  return (
    <div
      className={cn(
        "mt-3 rounded-2xl border text-[11px] overflow-hidden transition-all",
        isDarkMode
          ? "border-white/5 bg-[#020203]/50"
          : "bg-muted border-border",
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
          isDarkMode ? "hover:bg-white/5" : "hover:bg-muted/80",
        )}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
            isDarkMode ? "bg-emerald-500/10" : "bg-success/10",
          )}
        >
          <Wrench
            className={cn(
              "w-3 h-3",
              isDarkMode ? "text-emerald-400" : "text-success",
            )}
          />
        </div>
        <span
          className={cn(
            "font-bold uppercase tracking-widest truncate",
            isDarkMode ? "text-gray-400" : "text-muted-foreground",
          )}
        >
          {tc.name}
        </span>
        {tc.status === "pending" && (
          <span
            className={cn(
              "ml-auto flex items-center gap-1.5 font-black uppercase tracking-tighter",
              isDarkMode ? "text-[#ffaa00]" : "text-primary",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                isDarkMode ? "bg-[#ffaa00]" : "bg-primary",
              )}
            />
            Active
          </span>
        )}
        {tc.status === "error" && (
          <AlertCircle className="ml-auto w-3.5 h-3.5 text-destructive" />
        )}
        {tc.status === "done" && (
          <div className="ml-auto">
            {expanded ? (
              <ChevronDown className={cn("w-3.5 h-3.5", isDarkMode ? "text-gray-600" : "text-muted-foreground")} />
            ) : (
              <ChevronRight className={cn("w-3.5 h-3.5", isDarkMode ? "text-gray-600" : "text-muted-foreground")} />
            )}
          </div>
        )}
      </button>
      {expanded && tc.result && (
        <div
          className={cn(
            "px-4 py-4 border-t",
            isDarkMode ? "border-white/5 bg-black/30" : "border-border bg-background/50",
          )}
        >
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border mb-3 shadow-lg">
              <img
                src={imageUrl}
                alt="Tool Output"
                className="w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}
          <pre
            className={cn(
              "font-medium whitespace-pre-wrap break-all max-h-40 overflow-y-auto leading-relaxed",
              isDarkMode ? "text-gray-500" : "text-muted-foreground",
            )}
          >
            {tc.result.length > 1000 ? `${tc.result.slice(0, 1000)}...` : tc.result}
          </pre>
        </div>
      )}
    </div>
  );
}

function LoadingDots({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <span className="inline-flex gap-1.5 items-center px-2 py-1">
      <span
        className={cn(
          "w-1 h-1 rounded-full animate-bounce",
          isDarkMode ? "bg-[#ffaa00]" : "bg-primary",
        )}
        style={{ animationDelay: "0ms" }}
      />
      <span
        className={cn(
          "w-1 h-1 rounded-full animate-bounce",
          isDarkMode ? "bg-[#ffaa00]" : "bg-primary",
        )}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={cn(
          "w-1 h-1 rounded-full animate-bounce",
          isDarkMode ? "bg-[#ffaa00]" : "bg-primary",
        )}
        style={{ animationDelay: "300ms" }}
      />
    </span>
  );
}

function SimpleMarkdown({ text, isUser, isDarkMode }: { text: string; isUser: boolean; isDarkMode: boolean }) {
  const parts = text.split(/(\*\*.*?\*\*|_.*?_|\[.*?\]\(.*?\))/g);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={i}
              className={cn(
                isUser ? "font-black" : "font-bold",
                !isUser && (isDarkMode ? "text-white" : "text-foreground"),
              )}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("_") && part.endsWith("_")) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline hover:opacity-80 transition-opacity",
                isDarkMode
                  ? isUser ? "text-[#020203]" : "text-[#ffaa00]"
                  : "text-primary",
              )}
            >
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}

export function AiChatMessage({ message }: AiChatMessageProps) {
  const { isDarkMode } = useDarkMode();
  const isUser = message.role === "user";
  const isEmpty = !message.content && (!message.toolCalls || message.toolCalls.length === 0);

  return (
    <div className={cn("flex group", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[90%] p-5",
          isDarkMode
            ? isUser
              ? "bg-[#ffaa00] text-[#020203] rounded-3xl rounded-tr-lg shadow-[0_10px_30px_rgba(255,170,0,0.1)]"
              : "glass-panel border border-white/10 text-gray-200 rounded-3xl rounded-tl-lg"
            : isUser
            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
            : "bg-card border border-border text-card-foreground rounded-2xl rounded-tl-sm",
        )}
      >
        {isEmpty ? (
          <LoadingDots isDarkMode={isDarkMode} />
        ) : (
          <div className="flex gap-4">
            <div className="flex-1 space-y-3 overflow-hidden">
              {message.content && (
                <div className={cn("text-sm", isUser ? "font-bold" : "font-medium leading-relaxed")}>
                  <SimpleMarkdown text={message.content} isUser={isUser} isDarkMode={isDarkMode} />
                </div>
              )}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="space-y-2">
                  {message.toolCalls.map((tc, i) => (
                    <ToolCallCard key={`${tc.name}-${i}`} tc={tc} />
                  ))}
                </div>
              )}
            </div>
            {!isEmpty && (
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={message.content || ""} isUser={isUser} />
              </div>
            )}
          </div>
        )}
        <div
          className={cn(
            "text-[9px] font-black uppercase tracking-widest mt-3 opacity-40",
            isUser
              ? isDarkMode ? "text-[#020203] text-right" : "text-primary-foreground text-right"
              : isDarkMode ? "text-gray-500" : "text-muted-foreground",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
