import { useCallback, useEffect, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const STORAGE_KEY = "spike_welcome_shown";

const INTERESTS = [
  "AI Chat & Assistants",
  "Code Generation",
  "Image & Media",
  "Data Analysis",
  "Automation & Workflows",
  "MCP Tools",
  "APIs & Integrations",
  "DevOps & CI/CD",
];

const SUGGESTED_TOOLS: Record<string, { name: string; description: string }[]> = {
  "AI Chat & Assistants": [
    { name: "claude-chat", description: "Conversational AI powered by Claude" },
    { name: "openai-proxy", description: "GPT-4o via spike.land" },
  ],
  "Code Generation": [
    { name: "esbuild-wasm-mcp", description: "Transpile JS/TS in the browser" },
    { name: "spike-code", description: "Monaco editor with live preview" },
  ],
  "Image & Media": [
    { name: "mcp-image-studio", description: "AI image generation & enhancement" },
    { name: "remotion-video", description: "Programmatic video compositions" },
  ],
  "Data Analysis": [
    { name: "d1-query", description: "SQL over Cloudflare D1" },
    { name: "analytics-mcp", description: "Platform usage analytics" },
  ],
  "Automation & Workflows": [
    { name: "state-machine", description: "Statechart engine with guard parser" },
    { name: "qa-studio", description: "Browser automation via Playwright" },
  ],
  "MCP Tools": [
    { name: "spike-land-mcp", description: "80+ tools in one MCP registry" },
    { name: "hackernews-mcp", description: "Read & write HackerNews" },
  ],
  "APIs & Integrations": [
    { name: "spike-edge", description: "Edge API with Hono on Cloudflare" },
    { name: "openclaw-mcp", description: "MCP bridge for OpenClaw gateway" },
  ],
  "DevOps & CI/CD": [
    { name: "spike-review", description: "AI code review bot with GitHub" },
    { name: "vibe-dev", description: "Docker-based dev workflow tool" },
  ],
};

type Step = 0 | 1 | 2;

interface WelcomeModalProps {
  userName?: string | null;
}

export function WelcomeModal({ userName }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }, []);

  const trapRef = useFocusTrap(open, dismiss);

  function toggleInterest(interest: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) {
        next.delete(interest);
      } else {
        next.add(interest);
      }
      return next;
    });
  }

  const suggestedTools = Array.from(selected)
    .flatMap((i) => SUGGESTED_TOOLS[i] ?? [])
    .filter((tool, idx, arr) => arr.findIndex((t) => t.name === tool.name) === idx)
    .slice(0, 6);

  if (!open) return null;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to spike.land"
    >
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {([0, 1, 2] as Step[]).map((s) => (
                <span
                  key={s}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={dismiss}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome{userName ? `, ${userName}` : ""}!
              </h2>
              <p className="text-muted-foreground">
                spike.land is an AI development platform with 80+ MCP tools, real-time
                collaboration, and a code editor powered by Cloudflare Workers.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Build and deploy AI-powered apps",
                  "Browse 80+ MCP tools in one registry",
                  "Collaborate in real time",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">What are you building?</h2>
              <p className="text-sm text-muted-foreground">Choose your interests to get personalized tool suggestions.</p>
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all ${
                      selected.has(interest)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Suggested tools for you</h2>
              {suggestedTools.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Here are our most popular tools to get you started:</p>
                  {[
                    { name: "spike-land-mcp", description: "80+ tools in one MCP registry" },
                    { name: "spike-code", description: "Monaco editor with live preview" },
                    { name: "claude-chat", description: "Conversational AI powered by Claude" },
                  ].map((tool) => (
                    <div key={tool.name} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestedTools.map((tool) => (
                    <div key={tool.name} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {step === 0 ? "Get started" : "Next"}
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start exploring
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
