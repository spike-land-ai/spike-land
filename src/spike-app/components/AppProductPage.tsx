import { Shield, Zap, Layout, CheckCircle, Terminal } from "lucide-react";

interface AppProductPageProps {
  appId: string;
}

const toolMetadata: Record<string, {
  name: string;
  description: string;
  capabilities: string[];
  toolNames: string[];
  packagePath: string;
}> = {
  "chess-engine": {
    name: "Chess Engine",
    description: "ELO-rated chess engine with game, player, and challenge management. Create games, make moves, query boards, track ratings, and manage tournaments — all via MCP tools.",
    capabilities: [
      "Game lifecycle management (create, move, resign, draw)",
      "ELO rating system with player tracking",
      "Challenge management for matchmaking",
      "Board state queries in FEN/PGN format",
      "Tournament and leaderboard support",
    ],
    toolNames: ["create_game", "make_move", "get_board", "get_player", "create_challenge"],
    packagePath: "src/chess-engine",
  },
  "qa-studio": {
    name: "QA Studio",
    description: "Browser automation utilities powered by Playwright. Run end-to-end tests, capture screenshots, and automate browser workflows through MCP tool calls.",
    capabilities: [
      "Multi-browser test execution (Chromium, Firefox, WebKit)",
      "Screenshot capture and visual comparison",
      "Page interaction automation (click, type, navigate)",
      "Network request interception and mocking",
      "Accessibility auditing",
    ],
    toolNames: ["run_test", "capture_screenshot", "automate_workflow"],
    packagePath: "src/qa-studio",
  },
  "audio-mixer": {
    name: "Audio Mixer",
    description: "Audio track creation and effects processing via MCP. Create tracks, apply effects, mix channels, and export audio programmatically.",
    capabilities: [
      "Multi-track audio creation and mixing",
      "Real-time effects and filter application",
      "Channel volume and pan control",
      "Audio export in multiple formats",
      "Effect chain management",
    ],
    toolNames: ["create_track", "apply_effect", "mix_channels", "export_audio"],
    packagePath: "src/audio-mixer",
  },
};

export function AppProductPage({ appId }: AppProductPageProps) {
  const meta = toolMetadata[appId] ?? {
    name: appId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: "An MCP tool package on the Spike Land platform. Use the Terminal tab to interact with its tools.",
    capabilities: [
      "MCP-compatible tool interface",
      "JSON-RPC invocation via spike-edge",
      "Zod-validated input schemas",
      "Structured output responses",
    ],
    toolNames: [],
    packagePath: `src/${appId}`,
  };

  return (
    <div className="flex flex-col space-y-10 p-8 lg:p-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-info/10 px-4 py-1.5 text-sm font-semibold text-info-foreground">
          <Terminal className="h-4 w-4" />
          <span>MCP Tool</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">
          {meta.name}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          {meta.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("change-tab", { detail: "Terminal" }));
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-8 py-4 text-lg font-bold text-background shadow-lg transition hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Terminal className="h-5 w-5" />
            Open Terminal
          </button>
        </div>
      </div>

      {/* Tool Names */}
      {meta.toolNames.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Available Tools</h2>
          <div className="flex flex-wrap gap-2">
            {meta.toolNames.map((name) => (
              <code
                key={name}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-mono text-foreground"
              >
                {name}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Capabilities Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {meta.capabilities.map((capability, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info-foreground">
                {i % 5 === 0 && <Shield className="h-5 w-5" />}
                {i % 5 === 1 && <Zap className="h-5 w-5" />}
                {i % 5 === 2 && <Layout className="h-5 w-5" />}
                {i % 5 === 3 && <CheckCircle className="h-5 w-5" />}
                {i % 5 === 4 && <Terminal className="h-5 w-5" />}
              </div>
              <p className="text-muted-foreground leading-snug">{capability}</p>
            </div>
          ))}
      </div>

      {/* Package Info */}
      <div className="rounded-2xl bg-muted p-6 text-sm text-muted-foreground border border-border">
        <h3 className="font-bold text-foreground mb-2">Package Info</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Package: </span>
            <code className="text-foreground">@spike-land-ai/{appId}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Source: </span>
            <code className="text-foreground">{meta.packagePath}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Protocol: </span>
            <span>Model Context Protocol (MCP)</span>
          </div>
          <div>
            <span className="text-muted-foreground">Runtime: </span>
            <span>Node.js / Cloudflare Workers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
