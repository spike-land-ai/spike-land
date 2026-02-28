"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const VOICES = [
  { id: "alloy", name: "Alloy", accent: "Neutral", gender: "Neutral" },
  { id: "echo", name: "Echo", accent: "Neutral", gender: "Male" },
  { id: "fable", name: "Fable", accent: "British", gender: "Male" },
  { id: "onyx", name: "Onyx", accent: "Neutral", gender: "Male" },
  { id: "nova", name: "Nova", accent: "Neutral", gender: "Female" },
  { id: "shimmer", name: "Shimmer", accent: "Neutral", gender: "Female" },
];

interface TTSPanelProps {
  onGenerate: (text: string, voice: string) => Promise<void>;
  streamChunks: string[];
  streamText: string;
  isDone: boolean;
  error: Error | undefined;
  hasActiveProject: boolean;
}

export function TTSPanel({
  onGenerate,
  streamChunks,
  streamText,
  isDone,
  error,
  hasActiveProject,
}: TTSPanelProps) {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("nova");
  const isGenerating = streamChunks.length > 0 && !isDone && !error;
  const progress = streamChunks.length > 0
    ? Math.min(95, streamChunks.length * 15)
    : 0;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    await onGenerate(text.trim(), voice);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Text-to-Speech
        </span>
        <Badge
          variant="outline"
          className="text-[10px] border-violet-500/30 text-violet-300 h-4 px-1.5"
        >
          AI
        </Badge>
      </div>

      {/* Voice selector */}
      <Select value={voice} onValueChange={setVoice}>
        <SelectTrigger
          className="border-white/10 bg-white/5 text-white"
          id="tts-voice-selector"
        >
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-zinc-900 text-white">
          {VOICES.map(v => (
            <SelectItem key={v.id} value={v.id}>
              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3 text-violet-400" />
                <span>{v.name}</span>
                <span className="text-xs text-zinc-500">
                  {v.accent} • {v.gender}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Text input */}
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter text to convert to speech…"
        className="min-h-[80px] border-white/10 bg-white/5 text-white placeholder:text-zinc-600 resize-none"
        maxLength={5000}
        id="tts-text-input"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">
          {text.length}/5000 characters
        </span>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={!text.trim() || !hasActiveProject || isGenerating}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 shadow-lg shadow-violet-500/20"
        id="tts-generate-btn"
      >
        {isGenerating
          ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          )
          : (
            <>
              <Mic className="h-4 w-4" />
              Generate Speech
            </>
          )}
      </Button>

      {/* Progress */}
      {isGenerating && (
        <div className="space-y-1.5">
          <Progress value={progress} className="h-1.5" />
          <p className="text-[11px] text-violet-300 text-center">
            Streaming speech generation…
          </p>
        </div>
      )}

      {/* Success */}
      {isDone && streamText && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <p className="text-xs text-emerald-300">
            ✓ Speech generated and added as a new track
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error.message}</p>
        </div>
      )}
    </div>
  );
}
