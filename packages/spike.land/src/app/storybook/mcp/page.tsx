"use client";

import { useEffect, useState } from "react";
import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  PropsTable,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { McpToolCard } from "@/components/mcp/McpToolCard";
import { McpCategoryGrid } from "@/components/mcp/McpCategoryGrid";
import { McpConfigSnippet } from "@/components/mcp/McpConfigSnippet";
import { McpFeaturedTools } from "@/components/mcp/McpFeaturedTools";
import { McpResponseViewer } from "@/components/mcp/McpResponseViewer";
import type { McpToolDef } from "@/components/mcp/mcp-tool-registry";

// ---------------------------------------------------------------------------
// Mock MCP tool data for showcase
// ---------------------------------------------------------------------------

const MOCK_TOOLS: McpToolDef[] = [
  {
    name: "generate_image",
    displayName: "Generate Image",
    description:
      "Create AI-generated images from text prompts using multiple providers (DALL-E, Stable Diffusion).",
    category: "ai-generation",
    tier: "free",
    params: [
      {
        name: "prompt",
        type: "string",
        description: "A detailed description of the image to generate",
        required: true,
        placeholder: "A sunset over the ocean, photorealistic",
      },
      {
        name: "style",
        type: "enum",
        description: "Visual style for the generated image",
        required: false,
        enumValues: [
          "photorealistic",
          "illustration",
          "3d-render",
          "pixel-art",
        ],
      },
    ],
    responseType: "image",
    keywords: ["image", "picture", "art", "generate", "ai"],
    example: { prompt: "A sunset over the ocean, photorealistic" },
  },
  {
    name: "get_ai_response",
    displayName: "AI Chat",
    description:
      "Send a prompt to the AI model and receive a text completion. Supports streaming and context.",
    category: "ai-core",
    tier: "free",
    params: [
      {
        name: "prompt",
        type: "string",
        description: "The message or question to send",
        required: true,
        placeholder: "Explain quantum computing in simple terms",
      },
      {
        name: "model",
        type: "enum",
        description: "AI model to use",
        required: false,
        enumValues: ["claude-sonnet", "claude-opus", "claude-haiku"],
      },
    ],
    responseType: "text",
    keywords: ["chat", "ai", "text", "completion", "prompt"],
  },
  {
    name: "search_tools",
    displayName: "Search Tools",
    description: "Fuzzy-search across all registered MCP tools by name, description, or category.",
    category: "platform",
    tier: "free",
    params: [
      {
        name: "query",
        type: "string",
        description: "Search query string",
        required: true,
        placeholder: "image processing",
      },
    ],
    responseType: "json",
    keywords: ["search", "find", "tools", "discover"],
  },
  {
    name: "create_codespace",
    displayName: "Create Codespace",
    description:
      "Spin up a live code sandbox with esbuild-wasm transpilation. Supports React and TypeScript.",
    category: "developer",
    tier: "workspace",
    params: [
      {
        name: "template",
        type: "enum",
        description: "Starter template",
        required: true,
        enumValues: ["react-ts", "vanilla-ts", "node-ts"],
      },
      {
        name: "name",
        type: "string",
        description: "Display name for the codespace",
        required: false,
        placeholder: "my-experiment",
      },
    ],
    responseType: "json",
    keywords: ["code", "sandbox", "editor", "codespace"],
    example: { template: "react-ts" },
  },
];

// Mock response data for the response viewer
const MOCK_JSON_RESPONSE = {
  success: true,
  data: {
    tools: [
      { name: "generate_image", category: "ai-generation", tier: "free" },
      { name: "resize_image", category: "media", tier: "free" },
      { name: "apply_filter", category: "media", tier: "workspace" },
    ],
    total: 3,
    query: "image",
  },
};

const MOCK_MCP_CONFIG = `{
  "mcpServers": {
    "spike-land": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server", "--url", "https://spike.land/api/mcp"],
      "env": {
        "MCP_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Code snippets for CodePreview
// ---------------------------------------------------------------------------

const codeSnippets = {
  toolCard: `import { McpToolCard } from "@/components/mcp/McpToolCard";
import type { McpToolDef } from "@/components/mcp/mcp-tool-registry";

const tool: McpToolDef = {
  name: "generate_image",
  displayName: "Generate Image",
  description: "Create AI-generated images from text prompts.",
  category: "ai-generation",
  tier: "free",
  params: [
    { name: "prompt", type: "string", required: true },
  ],
  responseType: "image",
  keywords: ["image", "ai"],
};

<McpToolCard
  tool={tool}
  onTryIt={(t) => console.log("Try:", t.name)}
  isFavorite={false}
  onToggleFavorite={() => {}}
/>`,
  categoryGrid: `import { McpCategoryGrid } from "@/components/mcp/McpCategoryGrid";

const [selected, setSelected] = useState<string | null>(null);

<McpCategoryGrid
  selectedCategory={selected}
  onCategorySelect={setSelected}
/>`,
  configSnippet: `import { McpConfigSnippet } from "@/components/mcp/McpConfigSnippet";

<McpConfigSnippet
  label="claude_desktop_config.json"
  code={\`{
  "mcpServers": {
    "spike-land": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server", "--url", "https://spike.land/api/mcp"]
    }
  }
}\`}
/>`,
  responseViewer: `import { McpResponseViewer } from "@/components/mcp/McpResponseViewer";

// Loading state
<McpResponseViewer response={null} error={null} isExecuting={true} responseType="json" />

// Success state
<McpResponseViewer response={data} error={null} isExecuting={false} responseType="json" />

// Error state
<McpResponseViewer response={null} error="401 Unauthorized" isExecuting={false} responseType="json" />`,
};

// ---------------------------------------------------------------------------
// Animated terminal cursor component
// ---------------------------------------------------------------------------

function TerminalCursor() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block w-2 h-4 bg-green-400 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ transition: "opacity 0.08s ease-in-out" }}
      aria-hidden="true"
    />
  );
}

export default function McpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleTryIt = (_tool: McpToolDef) => {
    // No-op for storybook showcase
  };

  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="MCP Explorer"
        description="The Model Context Protocol (MCP) Explorer provides a visual interface for discovering, testing, and integrating with spike.land's 120+ MCP tools across AI, media, developer, and platform categories."
        usage="Use MCP components to build tool discovery UIs, interactive playgrounds, and API integration guides. All components support dark themes and responsive layouts."
      />

      <UsageGuide
        dos={[
          "Use McpToolCard to display individual tools with category badges and tier indicators.",
          "Use McpCategoryGrid to let users browse tools by super-category with visual grouping.",
          "Use McpConfigSnippet for copy-ready configuration blocks (JSON, shell commands).",
          "Use McpResponseViewer to display JSON, text, or image responses with error handling.",
          "Combine McpFeaturedTools with McpToolGrid for a complete discovery experience.",
        ]}
        donts={[
          "Don't bypass the proxy endpoint (/api/mcp/proxy) when executing tools from the client.",
          "Don't render McpTerminal in server components -- it requires xterm.js (client-only).",
          "Don't hardcode tool definitions; use the auto-generated mcp-tool-registry instead.",
          "Don't omit error states in McpResponseViewer; always handle loading, error, and empty.",
        ]}
      />

      {/* -- Props Tables -------------------------------------------------- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">API Reference</h2>
        <div className="space-y-6">
          <PropsTable
            componentName="McpToolCard"
            importPath='import { McpToolCard } from "@/components/mcp/McpToolCard"'
            props={[
              {
                name: "tool",
                type: "McpToolDef",
                required: true,
                description:
                  "The tool definition object including name, description, category, tier, and params.",
              },
              {
                name: "onTryIt",
                type: "(tool: McpToolDef) => void",
                required: true,
                description: "Callback fired when the user clicks the Try It button.",
              },
              {
                name: "isFavorite",
                type: "boolean",
                default: "false",
                description:
                  "Whether the tool is marked as a favorite. Controls the heart icon state.",
              },
              {
                name: "onToggleFavorite",
                type: "() => void",
                description: "Callback fired when the favorite toggle is clicked.",
              },
            ]}
          />
          <PropsTable
            componentName="McpCategoryGrid"
            importPath='import { McpCategoryGrid } from "@/components/mcp/McpCategoryGrid"'
            props={[
              {
                name: "selectedCategory",
                type: "string | null",
                required: true,
                description: "The currently selected category ID, or null for no selection.",
              },
              {
                name: "onCategorySelect",
                type: "(id: string | null) => void",
                required: true,
                description: "Callback fired when a category card is clicked.",
              },
            ]}
          />
          <PropsTable
            componentName="McpConfigSnippet"
            importPath='import { McpConfigSnippet } from "@/components/mcp/McpConfigSnippet"'
            props={[
              {
                name: "label",
                type: "string",
                required: true,
                description: "Title shown in the terminal chrome header bar.",
              },
              {
                name: "code",
                type: "string",
                required: true,
                description: "The code/config text to display inside the snippet.",
              },
            ]}
          />
          <PropsTable
            componentName="McpResponseViewer"
            importPath='import { McpResponseViewer } from "@/components/mcp/McpResponseViewer"'
            props={[
              {
                name: "response",
                type: "unknown | null",
                required: true,
                description: "The response data to display. Null shows empty or loading state.",
              },
              {
                name: "error",
                type: "string | null",
                required: true,
                description: "Error message string. Non-null triggers the error state.",
              },
              {
                name: "isExecuting",
                type: "boolean",
                required: true,
                description: "When true, shows the loading spinner animation.",
              },
              {
                name: "responseType",
                type: "\"json\" | \"text\" | \"image\"",
                required: true,
                description: "Controls how the response payload is rendered.",
              },
            ]}
          />
          <PropsTable
            componentName="McpFeaturedTools"
            importPath='import { McpFeaturedTools } from "@/components/mcp/McpFeaturedTools"'
            props={[
              {
                name: "onTryIt",
                type: "(tool: McpToolDef) => void",
                required: true,
                description: "Callback fired when a featured tool's Try It button is clicked.",
              },
            ]}
          />
        </div>
      </section>

      {/* -- McpToolCard --------------------------------------------------- */}
      <ComponentSample
        title="McpToolCard"
        description="Displays a single MCP tool with its name, description, category badge, tier indicator, parameter count, and action buttons. Supports favorites."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {MOCK_TOOLS.slice(0, 4).map(tool => (
            <McpToolCard
              key={tool.name}
              tool={tool}
              onTryIt={handleTryIt}
              isFavorite={tool.name === "generate_image"}
              onToggleFavorite={() => {}}
            />
          ))}
        </div>
      </ComponentSample>

      {/* -- McpCategoryGrid ----------------------------------------------- */}
      <ComponentSample
        title="McpCategoryGrid"
        description="A responsive grid of super-categories. Each card shows an icon, description, tool count, and subcategory chips. Click to filter the tool grid."
      >
        <div className="w-full max-w-5xl">
          <McpCategoryGrid
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>
      </ComponentSample>

      {/* -- McpConfigSnippet ---------------------------------------------- */}
      <ComponentSample
        title="McpConfigSnippet"
        description="A terminal-styled code block with macOS chrome, syntax display, and a one-click copy button. Ideal for MCP server configuration and API examples."
      >
        <div className="w-full max-w-2xl space-y-6">
          <McpConfigSnippet
            label="claude_desktop_config.json"
            code={MOCK_MCP_CONFIG}
          />
          <McpConfigSnippet
            label="Quick Install"
            code={`npx @anthropic-ai/mcp-server --url https://spike.land/api/mcp`}
          />
        </div>
      </ComponentSample>

      {/* -- McpFeaturedTools ---------------------------------------------- */}
      <ComponentSample
        title="McpFeaturedTools"
        description="A curated set of popular tools with one-click Quick Run and Customize buttons. Powered by FEATURED_DEFS in the registry."
      >
        <div className="w-full max-w-5xl">
          <McpFeaturedTools onTryIt={handleTryIt} />
        </div>
      </ComponentSample>

      {/* -- McpResponseViewer --------------------------------------------- */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">
          McpResponseViewer States
        </h2>
        <p className="text-muted-foreground -mt-4">
          The response viewer handles four states: loading, error, empty, and success. It supports
          JSON, text, and image response types with copy and download actions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Loading State
            </span>
            <McpResponseViewer
              response={null}
              error={null}
              isExecuting={true}
              responseType="json"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Empty State
            </span>
            <McpResponseViewer
              response={null}
              error={null}
              isExecuting={false}
              responseType="json"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Error State (401)
            </span>
            <McpResponseViewer
              response={null}
              error="401 Unauthorized: Missing or invalid authentication token"
              isExecuting={false}
              responseType="json"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              JSON Response
            </span>
            <McpResponseViewer
              response={MOCK_JSON_RESPONSE}
              error={null}
              isExecuting={false}
              responseType="json"
            />
          </div>
        </div>
      </section>

      {/* -- McpTerminal (description + animated mock) --------------------- */}
      <ComponentSample
        title="McpTerminal"
        description="A full xterm.js terminal emulator with custom shell, autocomplete, and live MCP tool execution. Requires client-side rendering with dynamic imports (xterm, fit-addon, web-links-addon). Not rendered inline here to avoid heavy dependencies -- visit /mcp to see it live."
      >
        <div className="w-full max-w-3xl">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1f2e] border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="ml-4 text-xs text-gray-400 font-mono">
                spike.land MCP Terminal
              </div>
            </div>
            <div className="bg-[#0a0f1a] px-4 py-6 font-mono text-sm leading-relaxed h-[300px] overflow-hidden">
              <p className="text-cyan-400">
                Welcome to spike.land MCP Terminal v1.0
              </p>
              <p className="text-zinc-500 mt-1">
                Type &apos;help&apos; to see available commands
              </p>
              <p className="text-zinc-500">
                Type &apos;list&apos; to browse all tools
              </p>
              <p className="text-zinc-500 mb-4">Press Tab for autocomplete</p>
              <p>
                <span className="text-green-400">mcp</span>
                <span className="text-zinc-600">&gt;</span>
                <span className="text-white">
                  search_tools --query &quot;image&quot;
                </span>
              </p>
              <p className="text-zinc-400 mt-2">
                Found 3 tools matching &quot;image&quot;:
              </p>
              <p className="text-cyan-300 ml-4">
                1. generate_image (AI Generation)
              </p>
              <p className="text-cyan-300 ml-4">2. resize_image (Media)</p>
              <p className="text-cyan-300 ml-4">3. apply_filter (Media)</p>
              <p className="mt-3">
                <span className="text-green-400">mcp</span>
                <span className="text-zinc-600">&gt;</span>
                <TerminalCursor />
              </p>
            </div>
          </div>
        </div>
      </ComponentSample>

      {/* -- Code Snippets ------------------------------------------------- */}
      <CodePreview
        code={codeSnippets.toolCard}
        title="Usage Examples"
        tabs={[
          { label: "McpToolCard", code: codeSnippets.toolCard },
          { label: "CategoryGrid", code: codeSnippets.categoryGrid },
          { label: "ConfigSnippet", code: codeSnippets.configSnippet },
          { label: "ResponseViewer", code: codeSnippets.responseViewer },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "McpToolCard uses semantic button elements with aria-label and aria-pressed for favorites.",
          "McpExplorerHero search implements combobox pattern with aria-expanded and aria-activedescendant.",
          "McpCategoryGrid uses toggle buttons with clear selected state indicators.",
          "McpResponseViewer uses role='alert' for error displays and role='status' for loading.",
          "McpTerminal supports keyboard navigation via xterm.js with configurable key bindings.",
          "All interactive elements meet 44px minimum touch target guidelines.",
          "Color contrast for tool badges and tier indicators exceeds WCAG AA standards.",
          "McpConfigSnippet copy button includes sr-only label for screen readers.",
        ]}
      />

      <RelatedComponents currentId="mcp" />
    </div>
  );
}
