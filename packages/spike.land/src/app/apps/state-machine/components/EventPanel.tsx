"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, RotateCcw, Send, Zap } from "lucide-react";
import type { StateNode, Transition } from "@/lib/state-machine/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventPanelProps {
  states: Record<string, StateNode>;
  transitions: Transition[];
  currentStates: string[];
  isLoading?: boolean;
  onSendEvent: (
    event: string,
    payload?: Record<string, unknown>,
  ) => Promise<unknown>;
  onReset: () => Promise<boolean>;
}

export function EventPanel({
  transitions,
  currentStates,
  isLoading = false,
  onSendEvent,
  onReset,
}: EventPanelProps) {
  const [eventName, setEventName] = useState("");
  const [payloadText, setPayloadText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  // Events available from current active states
  const availableEvents = useMemo(() => {
    const seen = new Set<string>();
    const events: Array<{ event: string; source: string; target: string; }> = [];
    for (const t of transitions) {
      if (currentStates.includes(t.source) && !seen.has(t.event)) {
        seen.add(t.event);
        events.push({ event: t.event, source: t.source, target: t.target });
      }
    }
    return events;
  }, [transitions, currentStates]);

  const parsePayload = useCallback((): Record<string, unknown> | undefined => {
    const trimmed = payloadText.trim();
    if (!trimmed) return undefined;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (
        typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ) {
        setPayloadError(null);
        return parsed as Record<string, unknown>;
      }
      setPayloadError("Payload must be a JSON object");
      return undefined;
    } catch {
      setPayloadError("Invalid JSON");
      return undefined;
    }
  }, [payloadText]);

  const handleSend = useCallback(
    async (eventOverride?: string) => {
      const evt = eventOverride ?? eventName.trim();
      if (!evt || isSending) return;

      const payload = parsePayload();
      if (payloadText.trim() && payloadError) return;

      setIsSending(true);
      try {
        await onSendEvent(evt, payload);
        if (!eventOverride) {
          setEventName("");
          setPayloadText("");
        }
      } finally {
        setIsSending(false);
      }
    },
    [
      eventName,
      isSending,
      parsePayload,
      payloadText,
      payloadError,
      onSendEvent,
    ],
  );

  const busy = isSending || isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Active states */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800/50 shrink-0">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
          Active States
        </p>
        <div className="flex flex-wrap gap-1.5">
          {currentStates.length === 0
            ? <span className="text-xs text-zinc-600 italic">None</span>
            : (
              currentStates.map(s => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {s}
                </span>
              ))
            )}
        </div>
      </div>

      {/* Quick-fire event buttons */}
      {availableEvents.length > 0 && (
        <div className="px-4 pt-3 pb-2 shrink-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Available Events
          </p>
          <div className="flex flex-wrap gap-2">
            {availableEvents.map(({ event, target }) => (
              <button
                key={event}
                onClick={() => handleSend(event)}
                disabled={busy}
                className={cn(
                  "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold",
                  "border border-zinc-700/60 bg-zinc-900/40",
                  "hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:text-white",
                  "transition-all duration-150 disabled:opacity-40",
                  "text-zinc-300",
                )}
                title={`→ ${target}`}
              >
                <Zap className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
                {event}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual event input */}
      <div className="px-4 pt-3 pb-2 shrink-0 space-y-2 border-t border-zinc-800/40">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Send Custom Event
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Event name..."
            disabled={busy}
            className={cn(
              "flex-1 px-3 py-2 rounded-xl text-sm",
              "bg-zinc-900/50 border border-zinc-800",
              "text-zinc-200 placeholder-zinc-600",
              "focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30",
              "transition-all disabled:opacity-50",
            )}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!eventName.trim() || busy}
            size="sm"
            className="h-9 px-3 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shrink-0"
          >
            {busy
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Payload textarea */}
        <div className="relative">
          <textarea
            value={payloadText}
            onChange={e => {
              setPayloadText(e.target.value);
              setPayloadError(null);
            }}
            placeholder='Payload (JSON): {"key": "value"}'
            rows={3}
            disabled={busy}
            className={cn(
              "w-full px-3 py-2 rounded-xl text-[11px] font-mono resize-none",
              "bg-zinc-900/50 border",
              payloadError ? "border-red-500/50" : "border-zinc-800",
              "text-zinc-300 placeholder-zinc-700",
              "focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30",
              "transition-all disabled:opacity-50",
            )}
          />
          {payloadError && (
            <p className="absolute bottom-2 right-2 text-[9px] text-red-400 font-medium">
              {payloadError}
            </p>
          )}
        </div>
      </div>

      {/* Reset button */}
      <div className="px-4 pb-4 mt-auto shrink-0">
        <Button
          onClick={() => onReset()}
          disabled={busy}
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/60 hover:border-zinc-700"
        >
          <RotateCcw className="w-3 h-3 mr-1.5" />
          Reset Machine
        </Button>
      </div>
    </div>
  );
}
