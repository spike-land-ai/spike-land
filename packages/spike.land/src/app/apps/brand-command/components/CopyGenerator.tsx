"use client";

import { useState } from "react";
import { Copy, Loader2, PenTool, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyGeneratorProps {
  isLoading: boolean;
  result: unknown;
  onGenerate: (args: { type: string; prompt: string; }) => void;
  onReset: () => void;
}

const COPY_TYPES = [
  { value: "ad", label: "Ad Copy" },
  { value: "tagline", label: "Tagline" },
  { value: "email", label: "Email Subject" },
  { value: "social", label: "Social Post" },
] as const;

type CopyType = (typeof COPY_TYPES)[number]["value"];

function extractTextContent(result: unknown): string | null {
  if (!result) return null;
  if (typeof result === "string") return result;
  if (typeof result === "object" && result !== null) {
    const r = result as Record<string, unknown>;
    if (typeof r.content === "string") return r.content;
    if (typeof r.text === "string") return r.text;
    if (typeof r.result === "string") return r.result;
    if (Array.isArray(r.content)) {
      const first = r.content[0];
      if (
        typeof first === "object"
        && first !== null
        && typeof (first as Record<string, unknown>).text === "string"
      ) {
        return (first as Record<string, unknown>).text as string;
      }
    }
  }
  return JSON.stringify(result, null, 2);
}

export function CopyGenerator({
  isLoading,
  result,
  onGenerate,
  onReset,
}: CopyGeneratorProps) {
  const [selectedType, setSelectedType] = useState<CopyType>("ad");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generatedText = extractTextContent(result);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({ type: selectedType, prompt });
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <PenTool className="w-5 h-5 text-fuchsia-400" />
        AI Copy Generator
      </h2>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
        {/* Type selector */}
        <div className="flex flex-wrap gap-2">
          {COPY_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedType === t.value
                  ? "bg-fuchsia-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe your brand, product, or campaign goal..."
          rows={3}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-0 flex-1"
          >
            {isLoading
              ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              )
              : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Copy
                </>
              )}
          </Button>
          {Boolean(result) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Result */}
        {generatedText && (
          <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-fuchsia-400">
                Generated Copy
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
              {generatedText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
