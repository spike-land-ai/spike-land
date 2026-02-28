"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, StopCircle } from "lucide-react";
import { useState } from "react";

interface AiGeneratePanelProps {
  isStreaming: boolean;
  streamText: string;
  isDone: boolean;
  error: Error | undefined;
  onGenerate: (prompt: string) => void;
  onStop: () => void;
}

const QUICK_PROMPTS = [
  "Lo-fi hip hop beat, relaxed",
  "Energetic drum pattern",
  "Jazz chord progression",
  "Ambient synth pad",
  "Funk bass line",
];

export function AiGeneratePanel({
  isStreaming,
  streamText,
  isDone,
  error,
  onGenerate,
  onStop,
}: AiGeneratePanelProps) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
          AI Generate
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Label htmlFor="ai-prompt" className="text-xs text-zinc-500">
          Describe what you want
        </Label>
        <div className="flex gap-2">
          <input
            id="ai-prompt"
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. chill lo-fi beat at 90 BPM…"
            disabled={isStreaming}
            className={`
              flex-1 h-8 px-2.5 rounded-md text-xs text-zinc-200 placeholder-zinc-600
              bg-white/5 border border-white/10 focus:outline-none focus:border-violet-500/60
              disabled:opacity-50
            `}
          />
          {isStreaming
            ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onStop}
                className="h-8 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              >
                <StopCircle className="h-3.5 w-3.5 mr-1" />
                Stop
              </Button>
            )
            : (
              <Button
                type="submit"
                size="sm"
                disabled={!prompt.trim()}
                className="h-8 bg-violet-600 hover:bg-violet-500 text-white border-0"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate
              </Button>
            )}
        </div>
      </form>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp}
            onClick={() => {
              setPrompt(qp);
              onGenerate(qp);
            }}
            disabled={isStreaming}
            className={`
              text-[10px] px-2 py-1 rounded-full border border-violet-500/20 text-violet-400
              hover:bg-violet-500/10 hover:border-violet-500/40 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Output */}
      {(isStreaming || streamText) && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          {isStreaming && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex gap-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-[10px] text-violet-400">Generating…</span>
            </div>
          )}
          {streamText && (
            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {streamText}
            </p>
          )}
          {isDone && !isStreaming && (
            <p className="text-[10px] text-violet-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Generation complete
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400">
          Error: {error.message}
        </p>
      )}
    </div>
  );
}
