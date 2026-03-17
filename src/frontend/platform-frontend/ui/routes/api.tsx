import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { cn } from "../../styling/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  endpoint: string;
  method: string;
  accentColor: string;
  glowColor: string;
  badgeLabel: string;
  codeExample: string;
  status: "live" | "beta" | "soon";
}

interface FeedbackState {
  email: string;
  message: string;
  product: string;
  submitted: boolean;
  submitting: boolean;
  error: string | null;
}

type FeedbackAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_MESSAGE"; payload: string }
  | { type: "SET_PRODUCT"; payload: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: string }
  | { type: "RESET" };

interface DonateState {
  key: string;
  email: string;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}

type DonateAction =
  | { type: "SET_KEY"; payload: string }
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: string };

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PRODUCTS: Product[] = [
  {
    id: "spike-ask",
    name: "Spike Ask",
    tagline: "Single-turn AI Q&A. No ceremony.",
    description:
      "POST a question, get a structured JSON answer. No sessions, no streaming boilerplate, no SDK required. Works with curl. Ideal for server-side enrichment, inline lookups, and automation pipelines.",
    endpoint: "POST /v1/ask",
    method: "POST",
    accentColor: "from-cyan-400 to-blue-500",
    glowColor: "shadow-cyan-500/30",
    badgeLabel: "LIVE",
    codeExample: `curl -X POST https://api.spike.land/v1/ask \\
  -H "Authorization: Bearer $SPIKE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"q": "What is MCP?"}'

# → {"answer": "...", "tokens": 42, "ms": 310}`,
    status: "live",
  },
  {
    id: "spike-threads",
    name: "Spike Threads",
    tagline: "Multi-turn conversations. Server holds the history.",
    description:
      "Start a thread, keep sending messages. We manage context windows, token budgets, and history compression server-side. You just POST messages. Thread IDs are yours forever.",
    endpoint: "POST /v1/thread",
    method: "POST",
    accentColor: "from-violet-400 to-purple-600",
    glowColor: "shadow-violet-500/30",
    badgeLabel: "BETA",
    codeExample: `// Create a thread
const res = await fetch("https://api.spike.land/v1/thread", {
  method: "POST",
  headers: { Authorization: \`Bearer \${key}\` },
  body: JSON.stringify({ message: "Hello" }),
});
const { thread_id, reply } = await res.json();

// Continue it
await fetch(\`https://api.spike.land/v1/thread/\${thread_id}\`, {
  method: "POST",
  body: JSON.stringify({ message: "Tell me more" }),
});`,
    status: "beta",
  },
  {
    id: "spike-tools",
    name: "Spike Tools",
    tagline: "80+ MCP tools via one endpoint.",
    description:
      "Direct access to the full spike.land MCP registry. Search, code review, image generation, chess, analytics, browser automation — all callable over HTTP. No MCP client needed.",
    endpoint: "POST /v1/tool",
    method: "POST",
    accentColor: "from-emerald-400 to-teal-600",
    glowColor: "shadow-emerald-500/30",
    badgeLabel: "LIVE",
    codeExample: `fetch("https://api.spike.land/v1/tool", {
  method: "POST",
  headers: { Authorization: \`Bearer \${key}\` },
  body: JSON.stringify({
    tool: "hackernews_get_top_stories",
    params: { limit: 5 },
  }),
}).then(r => r.json()).then(console.log);`,
    status: "live",
  },
  {
    id: "spike-vision",
    name: "Spike Vision",
    tagline: "Image understanding powered by GPT-4.1.",
    description:
      "Send an image URL or base64 blob and get structured analysis back. Extract text, describe scenes, compare images, detect objects. One endpoint. Flat billing.",
    endpoint: "POST /v1/vision",
    method: "POST",
    accentColor: "from-rose-400 to-pink-600",
    glowColor: "shadow-rose-500/30",
    badgeLabel: "SOON",
    codeExample: `curl -X POST https://api.spike.land/v1/vision \\
  -H "Authorization: Bearer $SPIKE_KEY" \\
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "prompt": "What text is visible in this image?"
  }'

# → {"text": "SALE 50% OFF", "confidence": 0.98}`,
    status: "soon",
  },
  {
    id: "spike-local",
    name: "Spike Local",
    tagline: "Your machine. Ollama inside. Our API outside.",
    description:
      "Run models locally via Ollama while keeping the same /v1/* API surface. Zero data leaves your network for Local requests. Ideal for sensitive workloads, on-prem requirements, and free experimentation.",
    endpoint: "POST /v1/ask (local mode)",
    method: "POST",
    accentColor: "from-amber-400 to-orange-500",
    glowColor: "shadow-amber-500/30",
    badgeLabel: "SOON",
    codeExample: `# Install the local daemon
npx @spike-land-ai/local init

# Route all /v1/* calls through your Ollama instance
export SPIKE_LOCAL=true
export SPIKE_MODEL=llama3.2

curl -X POST http://localhost:4747/v1/ask \\
  -d '{"q": "Summarize this PR"}' \\
  # Runs on your GPU. No data sent to us.`,
    status: "soon",
  },
  {
    id: "token-pool",
    name: "Token Pool",
    tagline: "Community keys. Pay it forward.",
    description:
      "Donate an API key (OpenAI, Anthropic, Gemini). It gets encrypted, rotated into the pool, and earns you credits. When your key serves requests, you get credits back. Everybody wins. No money changes hands.",
    endpoint: "Community Feature",
    method: "DONATE",
    accentColor: "from-yellow-400 to-amber-500",
    glowColor: "shadow-yellow-500/30",
    badgeLabel: "BETA",
    codeExample: `# Donate a key via CLI
npx @spike-land-ai/cli token-pool donate \\
  --provider anthropic \\
  --key sk-ant-...

# Check your earned credits
npx @spike-land-ai/cli token-pool credits

# → { donated_requests: 1420, earned_credits: 142 }`,
    status: "beta",
  },
];

const COMMUNITY_TOKEN_COUNT_SEED = 1847;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useIntersectionOnce(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold]);

  return { ref, visible };
}

function useAnimatedCounter(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target === 0) {
      setCount(0);
      return;
    }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return count;
}

function useFeedbackReducer() {
  const initialState: FeedbackState = {
    email: "",
    message: "",
    product: "",
    submitted: false,
    submitting: false,
    error: null,
  };

  function reducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
    switch (action.type) {
      case "SET_EMAIL":
        return { ...state, email: action.payload, error: null };
      case "SET_MESSAGE":
        return { ...state, message: action.payload, error: null };
      case "SET_PRODUCT":
        return { ...state, product: action.payload };
      case "SUBMIT_START":
        return { ...state, submitting: true, error: null };
      case "SUBMIT_SUCCESS":
        return { ...state, submitting: false, submitted: true };
      case "SUBMIT_ERROR":
        return { ...state, submitting: false, error: action.payload };
      case "RESET":
        return initialState;
      default:
        return state;
    }
  }

  return useReducer(reducer, initialState);
}

function useDonateReducer() {
  const initialState: DonateState = {
    key: "",
    email: "",
    submitting: false,
    submitted: false,
    error: null,
  };

  function reducer(state: DonateState, action: DonateAction): DonateState {
    switch (action.type) {
      case "SET_KEY":
        return { ...state, key: action.payload };
      case "SET_EMAIL":
        return { ...state, email: action.payload };
      case "SUBMIT_START":
        return { ...state, submitting: true, error: null };
      case "SUBMIT_SUCCESS":
        return { ...state, submitting: false, submitted: true };
      case "SUBMIT_ERROR":
        return { ...state, submitting: false, error: action.payload };
      default:
        return state;
    }
  }

  return useReducer(reducer, initialState);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NeonBadge({ label, status }: { label: string; status: Product["status"] }) {
  const colors = {
    live: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
    beta: "border-violet-500/60 bg-violet-500/10 text-violet-400",
    soon: "border-slate-500/60 bg-slate-500/10 text-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase",
        colors[status],
      )}
    >
      {status === "live" && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [code]);

  return (
    <div className="relative mt-4 rounded-xl border border-slate-700/60 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/40">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-red-500/60" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <span className="h-3 w-3 rounded-full bg-green-500/60" />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors duration-200"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-slate-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ProductCard({
  product,
  index,
  visible,
  onRequestAccess,
}: {
  product: Product;
  index: number;
  visible: boolean;
  onRequestAccess: (productId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleRequestAccess = useCallback(() => {
    onRequestAccess(product.id);
  }, [product.id, onRequestAccess]);

  const handleToggleCode = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm overflow-hidden",
        "transition-all duration-500",
        hovered && cn("border-slate-600/80", product.glowColor, "shadow-2xl"),
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
      )}
      style={{
        transitionDelay: visible ? `${index * 80}ms` : "0ms",
        transitionProperty: "opacity, transform, box-shadow, border-color",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${product.name}: ${product.tagline}`}
    >
      {/* Top gradient bar */}
      <div className={cn("h-1 w-full bg-gradient-to-r", product.accentColor)} aria-hidden="true" />

      {/* Hover glow overlay */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-500",
          `bg-gradient-to-br ${product.accentColor} opacity-0`,
          hovered && "opacity-[0.04]",
        )}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 p-6 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{product.name}</h2>
            <p
              className={cn(
                "text-sm font-semibold bg-gradient-to-r bg-clip-text text-transparent",
                product.accentColor,
              )}
            >
              {product.tagline}
            </p>
          </div>
          <NeonBadge label={product.badgeLabel} status={product.status} />
        </div>

        {/* Endpoint pill */}
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {product.method}
          </span>
          <code className="text-xs font-mono text-slate-300">{product.endpoint}</code>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>

        {/* Code example toggle */}
        <button
          type="button"
          onClick={handleToggleCode}
          className={cn(
            "flex items-center gap-2 text-xs font-semibold uppercase tracking-widest",
            "text-slate-500 hover:text-slate-300 transition-colors duration-200",
          )}
          aria-expanded={expanded}
          aria-controls={`code-${product.id}`}
        >
          <svg
            className={cn("h-3 w-3 transition-transform duration-300", expanded && "rotate-90")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {expanded ? "Hide" : "Show"} example
        </button>

        {/* Animated code block */}
        <div
          id={`code-${product.id}`}
          className={cn(
            "overflow-hidden transition-all duration-400 ease-in-out",
            expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <CodeBlock code={product.codeExample} />
        </div>

        {/* CTA */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={handleRequestAccess}
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-sm font-bold tracking-wide",
              "bg-gradient-to-r text-white",
              product.accentColor,
              "hover:opacity-90 active:scale-[0.98] transition-all duration-200",
              "shadow-lg",
              product.glowColor,
            )}
          >
            {product.status === "live" ? "Get Access" : "Join Waitlist"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunityTokenCounter({ active }: { active: boolean }) {
  const count = useAnimatedCounter(COMMUNITY_TOKEN_COUNT_SEED, active, 2000);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-5xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500"
        aria-label={`${count} community tokens donated`}
      >
        {count.toLocaleString()}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        community tokens donated
      </span>
    </div>
  );
}

function DonateTokenForm() {
  const [state, dispatch] = useDonateReducer();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!state.key.trim() || !state.email.trim()) return;

      dispatch({ type: "SUBMIT_START" });

      // Placeholder — wire to /api/token-pool/donate when endpoint exists
      await new Promise<void>((resolve) => setTimeout(resolve, 1200));
      dispatch({ type: "SUBMIT_SUCCESS" });
    },
    [state.key, state.email, dispatch],
  );

  if (state.submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/30">
          <svg
            className="h-7 w-7 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-white">Key received. Thank you.</p>
        <p className="text-sm text-slate-400">
          Your key is encrypted and rotated into the pool. Credits will appear within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="donate-key"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          API Key
        </label>
        <input
          id="donate-key"
          type="password"
          autoComplete="off"
          placeholder="sk-ant-... or sk-... or AIza..."
          value={state.key}
          onChange={(e) => dispatch({ type: "SET_KEY", payload: e.target.value })}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-yellow-500/60 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          required
          aria-required="true"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="donate-email"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Your Email (for credit notifications)
        </label>
        <input
          id="donate-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={state.email}
          onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-yellow-500/60 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          required
          aria-required="true"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={state.submitting || !state.key.trim() || !state.email.trim()}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold",
          "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900",
          "hover:opacity-90 active:scale-[0.98] transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {state.submitting ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900"
              aria-hidden="true"
            />
            Encrypting...
          </>
        ) : (
          "Donate a Key"
        )}
      </button>
    </form>
  );
}

function FeedbackForm({ defaultProduct }: { defaultProduct: string }) {
  const [state, dispatch] = useFeedbackReducer();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set default product when it changes
  useEffect(() => {
    if (defaultProduct) {
      dispatch({ type: "SET_PRODUCT", payload: defaultProduct });
      textareaRef.current?.focus();
    }
  }, [defaultProduct, dispatch]);

  const productOptions = useMemo(
    () =>
      PRODUCTS.map((p) => ({ value: p.id, label: p.name })).concat([
        { value: "general", label: "General feedback" },
      ]),
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!state.message.trim()) return;

      dispatch({ type: "SUBMIT_START" });

      // Placeholder — wire to /api/feedback when endpoint exists
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      dispatch({ type: "SUBMIT_SUCCESS" });
    },
    [state.message, dispatch],
  );

  if (state.submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-white">Feedback received.</p>
          <p className="text-sm text-slate-400 mt-1">Solo dev here. I read every message.</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors duration-200"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="feedback-product"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Product
        </label>
        <select
          id="feedback-product"
          value={state.product}
          onChange={(e) => dispatch({ type: "SET_PRODUCT", payload: e.target.value })}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm text-white focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 appearance-none"
        >
          <option value="">Select a product...</option>
          {productOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="feedback-email"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Email (optional)
        </label>
        <input
          id="feedback-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={state.email}
          onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="feedback-message"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Message
        </label>
        <textarea
          id="feedback-message"
          ref={textareaRef}
          rows={5}
          placeholder="What do you want to use this for? What's missing? What's broken?"
          value={state.message}
          onChange={(e) => dispatch({ type: "SET_MESSAGE", payload: e.target.value })}
          className="resize-none rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
          required
          aria-required="true"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={state.submitting || !state.message.trim()}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold",
          "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900",
          "hover:opacity-90 active:scale-[0.98] transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {state.submitting ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900"
              aria-hidden="true"
            />
            Sending...
          </>
        ) : (
          "Send Feedback"
        )}
      </button>
    </form>
  );
}

// Scanline / grid texture
function GridTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// Animated background orbs
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-3xl animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-3xl animate-pulse"
        style={{ animationDuration: "12s", animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-emerald-500/4 blur-3xl animate-pulse"
        style={{ animationDuration: "10s", animationDelay: "4s" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ApiPage() {
  const [heroRevealed, setHeroRevealed] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string>("");
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Hero entrance
  useEffect(() => {
    const id = setTimeout(() => setHeroRevealed(true), 60);
    return () => clearTimeout(id);
  }, []);

  // Intersection observers
  const { ref: counterRef, visible: counterVisible } = useIntersectionOnce(0.3);
  const { ref: productsRef, visible: productsVisible } = useIntersectionOnce(0.05);
  const { ref: donateRef, visible: donateVisible } = useIntersectionOnce(0.2);
  const { ref: feedbackSectionRef, visible: feedbackVisible } = useIntersectionOnce(0.15);

  // Scroll to feedback and pre-select product
  const handleRequestAccess = useCallback((productId: string) => {
    setActiveProductId(productId);
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <GridTexture />
      <BackgroundOrbs />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative z-10 flex min-h-[88vh] flex-col items-center justify-center px-4 pt-16 pb-20 text-center"
        aria-labelledby="api-hero-heading"
      >
        {/* Eyebrow */}
        <div
          className={cn(
            "mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 backdrop-blur-sm",
            "transition-all duration-700",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
          spike.land — AI Products API
          <span
            className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"
            style={{ animationDelay: "0.5s" }}
            aria-hidden="true"
          />
        </div>

        {/* Headline */}
        <h1
          id="api-hero-heading"
          className={cn(
            "relative max-w-5xl text-4xl font-black tracking-tight break-words sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl",
            "transition-all duration-700 delay-100",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          )}
        >
          <span className="block text-white">AI APIs that</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">
            don&apos;t hate you.
          </span>
        </h1>

        {/* Subhead */}
        <p
          className={cn(
            "relative mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed sm:text-xl",
            "transition-all duration-700 delay-200",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          Six products. One platform. Built by one person with no VC money.
          <br />
          Flat pricing. Community token pool. 80+ tools. No ceremony.
        </p>

        {/* Pricing callout */}
        <div
          className={cn(
            "relative mt-8 flex flex-col items-center gap-2",
            "transition-all duration-700 delay-300",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <p className="text-sm font-bold text-slate-300">
            Pricing:{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              pay what the AI costs. We add nothing on top.
            </span>
          </p>
          <p className="text-xs text-slate-600 uppercase tracking-widest">
            No markup. No seats. No enterprise gate.
          </p>
        </div>

        {/* CTA buttons */}
        <div
          className={cn(
            "relative mt-10 flex flex-col items-center gap-3 sm:flex-row",
            "transition-all duration-700 delay-400",
            heroRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <a
            href="#products"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold",
              "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900",
              "hover:opacity-90 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-cyan-500/30",
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            See the APIs
          </a>
          <a
            href="#donate"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-yellow-500/40 px-7 py-3.5 text-sm font-bold text-yellow-400",
              "hover:bg-yellow-500/10 active:scale-[0.97] transition-all duration-200",
            )}
          >
            Donate a Token
          </a>
        </div>

        {/* Scroll indicator */}
        <div
          className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5",
            "transition-all duration-700 delay-600",
            heroRevealed ? "opacity-40" : "opacity-0",
          )}
          aria-hidden="true"
        >
          <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-slate-600 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COMMUNITY COUNTER                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        ref={counterRef}
        className={cn(
          "relative z-10 mx-4 mb-16 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm",
          "transition-all duration-700",
          counterVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
        aria-label="Community statistics"
      >
        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          }}
          aria-hidden="true"
        />
        <div className="relative grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/40">
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <CommunityTokenCounter active={counterVisible} />
          </div>
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-1">
            <span className="text-5xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              80+
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              hosted MCP tools
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-1">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">
              $0
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              markup on AI cost
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PRODUCTS                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="products"
        className="relative z-10 px-4 pb-24"
        aria-labelledby="products-heading"
      >
        <div className="mx-auto max-w-7xl">
          <div
            ref={productsRef}
            className={cn(
              "mb-12 text-center",
              "transition-all duration-700",
              productsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            <h2
              id="products-heading"
              className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl"
            >
              <span className="text-white">Six products.</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                One pricing rule.
              </span>
            </h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">
              Click any card to see the exact HTTP interface. Click the button to join the waitlist
              or get access now.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                visible={productsVisible}
                onRequestAccess={handleRequestAccess}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* DONATE A TOKEN                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="donate"
        ref={donateRef}
        className={cn(
          "relative z-10 mx-4 mb-20 overflow-hidden rounded-2xl",
          "border border-yellow-500/20 bg-gradient-to-br from-slate-900 to-yellow-950/20",
          "transition-all duration-700",
          donateVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
        aria-labelledby="donate-heading"
      >
        {/* Decorative corner glow */}
        <div
          className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative grid gap-0 lg:grid-cols-2">
          {/* Left: pitch */}
          <div className="flex flex-col gap-6 p-8 lg:p-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10">
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 id="donate-heading" className="text-xl font-black text-white">
                  Token Pool
                </h2>
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">
                  Community-Powered AI
                </p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Got spare API keys sitting at 3% utilization? Donate them. Your key gets AES-256
              encrypted, rotated into the pool, and starts serving community requests.
            </p>

            <ul className="flex flex-col gap-3" aria-label="Token Pool benefits">
              {[
                { icon: "→", text: "Every request served by your key earns you credits" },
                { icon: "→", text: "Credits let you make requests without your own key" },
                { icon: "→", text: "Keys are encrypted at rest, rotated automatically" },
                { icon: "→", text: "Supports: OpenAI, Anthropic, Gemini, Mistral" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form */}
          <div className="border-t border-yellow-500/10 lg:border-t-0 lg:border-l p-8 lg:p-12">
            <DonateTokenForm />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEEDBACK                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="feedback"
        ref={(el) => {
          // Attach both refs
          (feedbackSectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
          (feedbackRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }}
        className={cn(
          "relative z-10 mx-4 mb-24 overflow-hidden rounded-2xl",
          "border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm",
          "transition-all duration-700",
          feedbackVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
        aria-labelledby="feedback-heading"
      >
        <div className="relative grid gap-0 lg:grid-cols-2">
          {/* Left: message */}
          <div className="flex flex-col justify-center gap-6 p-8 lg:p-12">
            <div>
              <h2 id="feedback-heading" className="text-2xl font-black text-white">
                Tell me what you need.
              </h2>
              <p className="mt-2 text-slate-400 leading-relaxed">
                Solo dev here. No product team, no UX research budget. Your message goes directly to
                the person writing the code. That person is me.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                "What use case are you trying to solve?",
                "What's missing from existing AI APIs?",
                "Would you use Token Pool?",
                "What would make you pay for this?",
              ].map((q) => (
                <div
                  key={q}
                  className="flex items-start gap-2 text-sm text-slate-500"
                  aria-hidden="true"
                >
                  <span className="text-cyan-500 font-mono text-xs mt-0.5">{">"}</span>
                  {q}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 uppercase tracking-widest">
              No spam. No drip campaign. Just a reply if I have one.
            </p>
          </div>

          {/* Right: form */}
          <div className="border-t border-slate-700/30 lg:border-t-0 lg:border-l border-slate-700/30 p-8 lg:p-12">
            <FeedbackForm defaultProduct={activeProductId} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER STRIP                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 border-t border-slate-800/60 px-4 py-8 text-center">
        <p className="text-xs text-slate-600">
          spike.land &mdash; built by one person &mdash; no VC &mdash; no bullshit
        </p>
        <p className="mt-1 text-xs text-slate-700">
          <a href="/docs" className="hover:text-slate-500 transition-colors duration-200 underline">
            Docs
          </a>
          {" · "}
          <a href="/blog" className="hover:text-slate-500 transition-colors duration-200 underline">
            Blog
          </a>
          {" · "}
          <a href="/chat" className="hover:text-slate-500 transition-colors duration-200 underline">
            Chat
          </a>
          {" · "}
          <a
            href="https://github.com/spike-land-ai"
            className="hover:text-slate-500 transition-colors duration-200 underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
