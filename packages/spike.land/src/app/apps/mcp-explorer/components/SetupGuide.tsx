"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code,
  ExternalLink,
  Globe,
  Key,
  Settings,
  Terminal,
  Zap,
} from "lucide-react";
import { McpConfigSnippet } from "@/components/mcp/McpConfigSnippet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; }>;
  done?: boolean;
}

const QUICKSTART_STEPS: Step[] = [
  {
    id: "get-key",
    title: "Get your API key",
    description:
      "Sign in to spike.land and navigate to Settings > API Keys to generate your personal MCP token.",
    icon: Key,
  },
  {
    id: "choose-client",
    title: "Choose your AI client",
    description:
      "Connect via Claude Desktop, Claude Code, Cursor, or any HTTP client. Config snippets are below.",
    icon: Settings,
  },
  {
    id: "call-tools",
    title: "Start calling tools",
    description:
      "Use the tool browser on the left to explore and try tools. The playground lets you test them right here.",
    icon: Zap,
  },
];

const claudeDesktopConfig = `{
  "mcpServers": {
    "spike-land": {
      "url": "https://spike.land/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`;

const claudeCodeConfig = `# Recommended: Device authorization (no key copy-paste needed)
# 1. Register a client, then request a device code:
curl -X POST https://spike.land/api/mcp/oauth/device \\
  -d 'client_id=YOUR_CLIENT_ID'
# 2. Open the verification URL in your browser and approve
# 3. Configure Claude Code:

claude mcp add --transport http \\
  --header "Authorization: Bearer YOUR_MCP_TOKEN" \\
  spike-land https://spike.land/api/mcp`;

const curlExample = `curl -X POST https://spike.land/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 1,
    "params": {
      "name": "search_tools",
      "arguments": { "query": "image generation" }
    }
  }'`;

const INTEGRATION_TABS = [
  {
    value: "claude-desktop",
    label: "Claude Desktop",
    icon: Settings,
    config: claudeDesktopConfig,
    language: "json",
  },
  {
    value: "claude-code",
    label: "Claude Code",
    icon: Terminal,
    config: claudeCodeConfig,
    language: "bash",
  },
  {
    value: "http",
    label: "HTTP / curl",
    icon: Globe,
    config: curlExample,
    language: "bash",
  },
];

const DOCS_LINKS = [
  {
    label: "MCP Protocol Spec",
    href: "https://modelcontextprotocol.io",
    icon: BookOpen,
  },
  { label: "API Reference", href: "/docs/api", icon: Code },
  { label: "Settings & API Keys", href: "/settings?tab=api-keys", icon: Key },
];

export function SetupGuide() {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Getting Started</h3>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
            3 steps
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quickstart steps */}
          <div className="space-y-2">
            {QUICKSTART_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(isActive ? null : step.id)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                    isActive
                      ? "bg-cyan-500/[0.06] border border-cyan-500/20"
                      : "hover:bg-white/[0.03] border border-transparent"
                  }`}
                  aria-expanded={isActive}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      step.done
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-white/[0.05] border border-white/[0.08]"
                    }`}
                  >
                    {step.done
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : (
                        <span className="text-[10px] font-bold text-zinc-400">
                          {index + 1}
                        </span>
                      )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <p className="text-xs font-semibold text-white">
                        {step.title}
                      </p>
                    </div>
                    {isActive && (
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform duration-150 mt-1 ${
                      isActive ? "rotate-90" : ""
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Integration config snippets */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Connection Configs
            </p>

            <Tabs defaultValue="claude-desktop">
              <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 h-auto rounded-xl mb-3 flex">
                {INTEGRATION_TABS.map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-1 text-[10px] gap-1 data-[state=active]:bg-white/[0.08] rounded-lg py-1.5"
                    >
                      <TabIcon className="w-3 h-3" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {INTEGRATION_TABS.map(tab => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  <McpConfigSnippet
                    code={tab.config}
                    language={tab.language as "json" | "bash"}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Docs links */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Documentation
            </p>
            <div className="space-y-1">
              {DOCS_LINKS.map(link => {
                const LinkIcon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-150 group"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    {link.href.startsWith("http") && (
                      <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
