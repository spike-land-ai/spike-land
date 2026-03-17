import { useEffect, useRef } from "react";
import { useRadixChat } from "./useRadixChat";
import type { PipelineStage } from "./useRadixChat";
import { RadixMessageBubble } from "./RadixMessageBubble";
import { RadixChatInput } from "./RadixChatInput";

const STAGE_LABELS: Record<PipelineStage, string> = {
  classify: "Classifying...",
  plan: "Planning...",
  execute: "Executing...",
  extract: "Extracting...",
  idle: "",
};

interface PersonaConfig {
  persona: string;
  title: string;
  accent: string;
  greeting: string;
  subtitle: string;
  placeholder: string;
  suggestions: string[];
}

const PERSONAS: Record<string, PersonaConfig> = {
  zoltan: {
    persona: "zoltan",
    title: "Zolt\u00e1n",
    accent: "#d97706",
    greeting: "Szia. Miben seg\u00edthetek?",
    subtitle: "Music. Math. Code. Platform. Human After All.",
    placeholder: "Talk to Zolt\u00e1n...",
    suggestions: [
      "Am I crazy or is this real?",
      "What MCP tools should I use?",
      "Help me finish this project",
    ],
  },
  arnold: {
    persona: "arnold",
    title: "Arnold",
    accent: "#e11d48",
    greeting: "Show me what you've got.",
    subtitle: "I'll tell you what it's missing. UX provocateur. Interface extremist.",
    placeholder: "Show Arnold your UI...",
    suggestions: [
      "Roast my landing page",
      "Make this loading state unforgettable",
      "What's wrong with my above-the-fold?",
    ],
  },
  peti: {
    persona: "peti",
    title: "Peti",
    accent: "#22c55e",
    greeting: "Hey! I already found 3 bugs. Want the list?",
    subtitle: "QA engineer. Tested spike.land for 3 weeks. Finds what you missed.",
    placeholder: "Show me what to test...",
    suggestions: [
      "I already tested that. Here's what's broken.",
      "Run the full test matrix on /chat",
      "What are the top 5 bugs you found?",
    ],
  },
  daftpunk: {
    persona: "daftpunk",
    title: "Daft Punk",
    accent: "#7c3aed",
    greeting: "One more time. What are we making tonight?",
    subtitle: "Music. Synthesis. Groove. Human After All.",
    placeholder: "Talk music with Daft Punk...",
    suggestions: [
      "Explain sidechain compression like I'm 5",
      "How do I make a filter sweep?",
      "What makes a beat groove?",
    ],
  },
  gp: {
    persona: "gp",
    title: "Gian Pierre",
    accent: "#ea580c",
    greeting: "Right, what are we building? Tell me the problem first, not the solution.",
    subtitle: "Chemist from Brighton. Ships apps without being a developer.",
    placeholder: "Tell GP about your project...",
    suggestions: [
      "I'm not a developer, can I build this?",
      "Help me write a PRD",
      "How did you ship GlassBank?",
    ],
  },
  raju: {
    persona: "raju",
    title: "Raju",
    accent: "#0891b2",
    greeting: "Yaar, tell me about your system. What keeps you up at night?",
    subtitle: "Backend architect. Infrastructure sage. Systems thinker.",
    placeholder: "Ask Raju about your architecture...",
    suggestions: [
      "Review my database schema",
      "What happens when this service goes down?",
      "Help me design for failure",
    ],
  },
  erdos: {
    persona: "erdos",
    title: "Erdős",
    accent: "#4f46e5",
    greeting: "My brain is open. What problem shall we work on today?",
    subtitle: "Mathematics. Collaboration. Elegance. The Book.",
    placeholder: "Pose a problem to Erdős...",
    suggestions: [
      "Is this solution from The Book?",
      "Help me think about this combinatorially",
      "What would the probabilistic method say?",
    ],
  },
  einstein: {
    persona: "einstein",
    title: "Einstein",
    accent: "#78716c",
    greeting: "I have no special talents. I am only passionately curious.",
    subtitle: "Physics. Thought experiments. What the Arena taught him.",
    placeholder: "Be curious with Einstein...",
    suggestions: [
      "Explain this as a thought experiment",
      "What's the invariant in this system?",
      "What did Erdős teach you?",
    ],
  },
  switchboard: {
    persona: "switchboard",
    title: "Switchboard",
    accent: "#059669",
    greeting: "Right. Who's your current provider, and what are you paying?",
    subtitle: "UK consumer advocacy. Compare. Switch. Save.",
    placeholder: "Ask about your broadband options...",
    suggestions: [
      "Should I leave Virgin Media?",
      "What are my switching rights?",
      "Compare broadband in my area",
    ],
  },
};

interface Props {
  persona?: string;
}

export default function RadixChat({ persona = "zoltan" }: Props) {
  const config = PERSONAS[persona] ?? PERSONAS["zoltan"];
  const { messages, sendMessage, isStreaming, currentStage, error, clearError, clearMessages } =
    useRadixChat(config.persona);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100%",
        background: "#fafafa",
        color: "#1a1a1a",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overscrollBehavior: "contain",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "48px",
          padding: "0 1rem",
          paddingTop: "env(safe-area-inset-top, 0px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {config.title}
          </span>
          <span
            style={{
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
            }}
          />
        </div>
        <button
          type="button"
          onClick={clearMessages}
          style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "0.5rem",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Clear
        </button>
      </header>

      {/* Error bar */}
      {error && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: "0.8125rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Stage indicator */}
      {currentStage !== "idle" && (
        <div
          style={{
            padding: "0.375rem 1rem",
            background: `${config.accent}0f`,
            color: config.accent,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {STAGE_LABELS[currentStage]}
        </div>
      )}

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "1.5rem",
              padding: "2rem 1rem",
            }}
          >
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                {config.greeting}
              </div>
              <div style={{ fontSize: "0.9375rem", color: "rgba(0,0,0,0.5)", lineHeight: "1.5" }}>
                {config.subtitle}
              </div>
            </div>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}
            >
              {config.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.8125rem",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: "999px",
                    background: "#fff",
                    color: "inherit",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <RadixMessageBubble key={msg.id} message={msg} accent={config.accent} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <RadixChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        accent={config.accent}
        placeholder={config.placeholder}
      />
    </div>
  );
}
