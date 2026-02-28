"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { JsonView } from "@/components/chat/JsonView";
import { CodeToolRenderer } from "@/components/chat/tool-renderers/CodeToolRenderer";
import { SearchToolRenderer } from "@/components/chat/tool-renderers/SearchToolRenderer";
import { FileToolRenderer } from "@/components/chat/tool-renderers/FileToolRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  CornerDownRight,
  Loader2,
  MessageCircle,
  Paperclip,
  Pen,
  Reply,
  Send,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ── Mock Data ────────────────────────────────────────────── */

const markdownBasic = `Here's what I found about your project:

**spike.land** is a real-time collaborative code editor built on Cloudflare Workers. It supports:

- Live code editing with Monaco Editor
- WebSocket-based real-time sync
- Transpilation via \`esbuild-wasm\`

> The platform processes over **10,000 requests/min** during peak hours.

Check the [documentation](https://spike.land/docs) for more details.`;

const markdownCodeBlock = `Here's a quick example of how to use the API:

\`\`\`typescript
import { createClient } from "@spike-land/sdk";

const client = createClient({
  apiKey: process.env.SPIKE_API_KEY,
  region: "eu-west-1",
});

const result = await client.transpile({
  code: 'const x: number = 42;',
  format: "esm",
});

console.log(result.output);
\`\`\`

The \`transpile\` method accepts TypeScript, JSX, and TSX inputs.`;

const markdownTable = `### Token Usage Summary

| Model | Input Tokens | Output Tokens | Cost |
|-------|-------------|---------------|------|
| Claude Opus 4.6 | 12,450 | 3,200 | $0.48 |
| Claude Sonnet 4.6 | 8,100 | 2,800 | $0.12 |
| Claude Haiku 4.5 | 45,000 | 12,000 | $0.08 |

---

Total monthly spend: **$0.68** across all models.`;

const markdownList = `### Next Steps

1. Set up the development environment
2. Configure authentication providers:
   - GitHub OAuth
   - Google OAuth
   - Apple Sign-In
3. Run the test suite with \`yarn test:coverage\`
4. Deploy to staging via \`yarn depot:ci\`

**Note:** Make sure Redis is running locally before starting the dev server.`;

const sampleJsonData = {
  user: {
    id: "usr_abc123",
    name: "Zoltan Erdos",
    email: "z@spike.land",
    plan: "pro",
    tokens: { remaining: 4500, total: 10000 },
  },
  apps: [
    { id: "app_001", name: "Chess Arena", status: "active", users: 128 },
    { id: "app_002", name: "QA Studio", status: "active", users: 45 },
    { id: "app_003", name: "Audio Mixer", status: "beta", users: 12 },
  ],
  metadata: {
    region: "eu-west-1",
    version: "2.4.0",
    lastDeploy: "2026-02-24T18:30:00Z",
  },
};

const sampleNestedJson = {
  request: {
    method: "POST",
    url: "/api/mcp",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer ***",
    },
  },
  response: {
    status: 200,
    body: {
      tools: ["search", "code_eval", "file_read"],
      session: { id: "sess_xyz", turns: 3, maxTurns: 10 },
    },
  },
};

const codeToolResult = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getActiveUsers() {
  return prisma.user.findMany({
    where: {
      lastActive: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
    },
    orderBy: { lastActive: "desc" },
  });
}`;

const searchToolResult = JSON.stringify([
  {
    title: "Chess Arena - Multiplayer Chess",
    description: "Real-time multiplayer chess with ELO ranking, challenges, and spectator mode.",
  },
  {
    title: "QA Studio - Browser Automation",
    description: "Automated browser testing, accessibility audits, and visual regression testing.",
  },
  {
    title: "Audio Mixer - Production Suite",
    description: "Web-based audio mixing with multi-track support and real-time effects.",
  },
  {
    title: "Tabletop Simulator",
    description:
      "Virtual tabletop for board games with physics, dice rolling, and card management.",
  },
]);

const fileToolResult = `src/lib/mcp/server/tools/search-tool.ts
import { z } from "zod";
import { defineTool } from "../define-tool";

export const searchTool = defineTool({
  name: "search",
  description: "Search the codebase for files and content",
  parameters: z.object({
    query: z.string().describe("Search query"),
    type: z.enum(["files", "content"]).default("content"),
    limit: z.number().default(10),
  }),
  execute: async ({ query, type, limit }) => {
    // Implementation here...
  },
});`;

/* ── Code Snippets ────────────────────────────────────────── */

const codeSnippets = {
  chatMarkdown: `import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

<ChatMarkdown content="**Bold** text with \`inline code\` and [links](https://spike.land)" />`,
  jsonView: `import { JsonView } from "@/components/chat/JsonView";

<JsonView data={myObject} maxExpandDepth={2} />`,
  toolRenderer:
    `import { CodeToolRenderer } from "@/components/chat/tool-renderers/CodeToolRenderer";
import { SearchToolRenderer } from "@/components/chat/tool-renderers/SearchToolRenderer";
import { FileToolRenderer } from "@/components/chat/tool-renderers/FileToolRenderer";

<CodeToolRenderer result={codeOutput} isError={false} name="code_eval" />
<SearchToolRenderer result={jsonResults} isError={false} name="search_apps" />
<FileToolRenderer result={fileContent} isError={false} name="file_read" />`,
  siteChat: `import { SiteChatLazy } from "@/components/chat/SiteChatLazy";

// Lazy-loaded floating chat widget
<SiteChatLazy />`,
};

/* ── Page ─────────────────────────────────────────────────── */

export default function ChatPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Chat & Messaging"
        description="Components powering the spike.land agent chat experience. From markdown rendering and tool call visualization to the full SiteChat widget, these building blocks create a rich conversational AI interface."
        usage="Use these components when building chat interfaces, AI agent UIs, or anywhere structured tool results and markdown content need to be displayed."
      />

      <UsageGuide
        dos={[
          "Use ChatMarkdown for all AI-generated text content in chat contexts.",
          "Display tool calls with ToolCallCard for transparent AI reasoning.",
          "Use JsonView for structured data inspection in debug panels or tool results.",
          "Keep the SiteChat widget lightweight; lazy-load it with SiteChatLazy.",
        ]}
        donts={[
          "Don't render raw HTML in chat messages; always use ChatMarkdown for safety.",
          "Don't display tool call internals to end users without collapsible wrappers.",
          "Don't use JsonView for very large datasets (>1MB); paginate instead.",
          "Don't auto-open the SiteChat widget on page load; respect user intent.",
        ]}
      />

      {/* ── Typing Indicator Animation ─────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Typing Indicator</h2>
        <p className="text-muted-foreground -mt-4">
          Animated dot indicators showing that the AI agent is composing a response. Three variants
          demonstrate different animation patterns for various contexts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComponentSample
            title="Pulse Dots"
            description="Default indicator with staggered pulse animation. Used in the main chat bubble."
          >
            <TypingIndicatorPulse />
          </ComponentSample>

          <ComponentSample
            title="Bounce Dots"
            description="Bouncing dots for a more playful feel. Suitable for casual chat contexts."
          >
            <TypingIndicatorBounce />
          </ComponentSample>

          <ComponentSample
            title="Fade Wave"
            description="Smooth opacity wave for a subtle, professional appearance."
          >
            <TypingIndicatorWave />
          </ComponentSample>
        </div>
      </section>

      {/* ── ChatMarkdown ──────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">ChatMarkdown</h2>
        <p className="text-muted-foreground -mt-4">
          A compact markdown renderer tailored for chat bubbles. Uses smaller typography, tighter
          spacing, and chat-appropriate link colors.
        </p>

        <ComponentSample
          title="Basic Prose"
          description="Paragraphs, bold text, links, bullet lists, and blockquotes rendered in chat context."
        >
          <div className="w-full max-w-lg">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <ChatMarkdown content={markdownBasic} />
            </div>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Code Blocks"
          description="Fenced code blocks with syntax-appropriate styling and horizontal scroll."
        >
          <div className="w-full max-w-lg">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <ChatMarkdown content={markdownCodeBlock} />
            </div>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Tables"
          description="GFM tables rendered with compact borders and header styling."
        >
          <div className="w-full max-w-lg">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <ChatMarkdown content={markdownTable} />
            </div>
          </div>
        </ComponentSample>

        <ComponentSample
          title="Ordered Lists & Notes"
          description="Numbered lists with nested content and emphasis."
        >
          <div className="w-full max-w-lg">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <ChatMarkdown content={markdownList} />
            </div>
          </div>
        </ComponentSample>
      </section>

      {/* ── ToolCallCard (Mockups) ────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">ToolCallCard</h2>
        <p className="text-muted-foreground -mt-4">
          Collapsible card showing tool name, server badge, status icon, and expandable input/result
          sections. Each status (running, done, error) has distinct styling.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ToolCallMockup
            name="search_apps"
            serverName="store"
            status="done"
            label="Completed"
          />
          <ToolCallMockup
            name="code_eval"
            serverName="transpiler"
            status="running"
            label="Running"
          />
          <ToolCallMockup
            name="file_write"
            serverName="fs"
            status="error"
            label="Error"
          />
        </div>
      </section>

      {/* ── Tool Renderers ────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Tool Renderers</h2>
        <p className="text-muted-foreground -mt-4">
          Specialized renderers for different tool output types. The registry matches tool names to
          renderers via regex patterns.
        </p>

        <ComponentSample
          title="CodeToolRenderer"
          description="Displays code output with syntax-colored monospace styling. Used for eval, transpile, and execute tools."
        >
          <div className="w-full max-w-2xl">
            <CodeToolRenderer
              result={codeToolResult}
              isError={false}
              name="code_eval"
            />
          </div>
        </ComponentSample>

        <ComponentSample
          title="SearchToolRenderer"
          description="Parses JSON arrays into structured result cards with titles and descriptions."
        >
          <div className="w-full max-w-lg">
            <SearchToolRenderer
              result={searchToolResult}
              isError={false}
              name="search_apps"
            />
          </div>
        </ComponentSample>

        <ComponentSample
          title="FileToolRenderer"
          description="Detects file paths in results and renders with file icon header and code preview."
        >
          <div className="w-full max-w-2xl">
            <FileToolRenderer
              result={fileToolResult}
              isError={false}
              name="file_read"
            />
          </div>
        </ComponentSample>

        <ComponentSample
          title="CodeToolRenderer (Error)"
          description="Error state with red-tinted background for failed tool executions."
        >
          <div className="w-full max-w-2xl">
            <CodeToolRenderer
              result="TypeError: Cannot read properties of undefined (reading 'map')\n    at getActiveUsers (src/lib/users.ts:14:22)\n    at async handler (src/app/api/users/route.ts:8:18)"
              isError={true}
              name="code_eval"
            />
          </div>
        </ComponentSample>
      </section>

      {/* ── JsonView ──────────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">JsonView</h2>
        <p className="text-muted-foreground -mt-4">
          Interactive, collapsible JSON tree viewer with syntax colouring. Supports configurable max
          expansion depth and handles all JSON primitives.
        </p>

        <ComponentSample
          title="User & Apps Data"
          description="Nested object with arrays, strings, numbers, and null values. Click nodes to expand/collapse."
        >
          <div className="w-full max-w-xl">
            <JsonView data={sampleJsonData} maxExpandDepth={3} />
          </div>
        </ComponentSample>

        <ComponentSample
          title="Request/Response Pair"
          description="API request and response structure with default expansion depth of 2."
        >
          <div className="w-full max-w-xl">
            <JsonView data={sampleNestedJson} maxExpandDepth={2} />
          </div>
        </ComponentSample>

        <ComponentSample
          title="Primitives & Edge Cases"
          description="How JsonView handles different data types at the root level."
        >
          <div className="w-full max-w-xl space-y-3">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs shrink-0">
                string
              </Badge>
              <JsonView data="Hello, spike.land!" />
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs shrink-0">
                number
              </Badge>
              <JsonView data={42} />
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs shrink-0">
                boolean
              </Badge>
              <JsonView data={true} />
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs shrink-0">null</Badge>
              <JsonView data={null} />
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs shrink-0">
                array
              </Badge>
              <JsonView data={["chess", "qa-studio", "audio-mixer"]} />
            </div>
          </div>
        </ComponentSample>
      </section>

      {/* ── Message Threading Demo ─────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">Message Threading</h2>
        <p className="text-muted-foreground -mt-4">
          Threaded conversations allow users to reply to specific messages, creating nested
          discussion branches. This pattern keeps context clear in complex multi-topic
          conversations.
        </p>

        <ComponentSample
          title="Thread View"
          description="A parent message with nested replies showing threading indicators and depth."
        >
          <div className="w-full max-w-md space-y-2">
            {/* Parent message (AI) */}
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-300">
                <ChatMarkdown content="I found **3 relevant files** for your authentication setup. Here's what I recommend:" />
              </div>
            </div>

            {/* Reply indicator */}
            <div className="flex items-start gap-2 pl-6">
              <div className="flex flex-col items-center">
                <CornerDownRight className="h-3.5 w-3.5 text-zinc-600" />
              </div>
              <div className="flex-1 space-y-2">
                {/* Threaded reply (User) */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-amber-500/20 text-amber-100">
                    <div className="flex items-center gap-1.5 mb-1 opacity-60">
                      <Reply className="h-3 w-3" />
                      <span className="text-[10px]">Replying to agent</span>
                    </div>
                    Can you show me the auth config file?
                  </div>
                </div>

                {/* Threaded reply (AI) */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] space-y-2">
                    <div className="rounded-lg border border-white/10 bg-white/5 text-sm">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                        <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-medium text-zinc-200 text-xs">
                          File Read
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-auto text-[10px] px-1.5 py-0 h-5 border-white/10 text-zinc-500"
                        >
                          fs
                        </Badge>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                      <ChatMarkdown content="Here's `src/lib/auth/config.ts` with your NextAuth.js setup." />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second thread */}
            <div className="flex items-start gap-2 pl-6">
              <div className="flex flex-col items-center">
                <CornerDownRight className="h-3.5 w-3.5 text-zinc-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-amber-500/20 text-amber-100">
                    <div className="flex items-center gap-1.5 mb-1 opacity-60">
                      <Reply className="h-3 w-3" />
                      <span className="text-[10px]">Replying to agent</span>
                    </div>
                    What about the middleware?
                  </div>
                </div>
              </div>
            </div>

            {/* Typing indicator in thread */}
            <div className="flex items-start gap-2 pl-6">
              <div className="flex flex-col items-center">
                <CornerDownRight className="h-3.5 w-3.5 text-zinc-600" />
              </div>
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2 bg-white/5">
                  <TypingIndicatorPulse />
                </div>
              </div>
            </div>
          </div>
        </ComponentSample>
      </section>

      {/* ── SiteChat Widget Mockup ────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">SiteChat Widget</h2>
        <p className="text-muted-foreground -mt-4">
          The floating chat widget that provides an AI agent interface across the site. Below is a
          non-functional visual mockup showing the two states.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Closed state */}
          <ComponentSample
            title="Closed State (FAB)"
            description="Floating action button with pulse indicator in the bottom-right corner."
          >
            <div className="relative h-32 w-full">
              <div className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-zinc-950 shadow-lg">
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-300" />
                </span>
              </div>
            </div>
          </ComponentSample>

          {/* Open state */}
          <ComponentSample
            title="Open State"
            description="Full chat panel with header, message area, and input bar."
          >
            <SiteChatMockup />
          </ComponentSample>
        </div>
      </section>

      {/* ── ImageAnnotator Mockup ─────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">ImageAnnotator</h2>
        <p className="text-muted-foreground -mt-4">
          Full-screen overlay for drawing annotations on screenshots before attaching them to chat
          messages. Below is a simplified visual representation of the UI controls.
        </p>

        <ComponentSample
          title="Annotator Controls"
          description="Header with Cancel/Save buttons and drawing indicator. The actual canvas is not rendered here."
        >
          <div className="w-full max-w-lg">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-6">
              {/* Header controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Pen className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Draw on screenshot
                  </span>
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Use Screenshot
                  </Button>
                </div>
              </div>

              {/* Canvas placeholder */}
              <div className="aspect-video rounded-lg border border-white/10 bg-zinc-900/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Camera className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-600">
                    Screenshot canvas area
                  </p>
                  <p className="text-[10px] text-zinc-700">
                    Draw with mouse or touch to annotate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ComponentSample>
      </section>

      {/* ── Message Bubble Anatomy ────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold font-heading">
          Message Bubble Anatomy
        </h2>
        <p className="text-muted-foreground -mt-4">
          Chat messages support text, images, and tool call blocks. User messages appear
          right-aligned with amber tinting; AI messages left-aligned with neutral styling.
        </p>

        <ComponentSample
          title="Conversation Flow"
          description="A realistic back-and-forth between user and AI agent showing different content types."
        >
          <div className="w-full max-w-md space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-amber-500/20 text-amber-100">
                Can you search the app store for games?
              </div>
            </div>

            {/* AI tool call */}
            <div className="flex justify-start">
              <div className="max-w-[90%] space-y-2">
                <div className="rounded-lg border border-white/10 bg-white/5 text-sm">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                    <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-medium text-zinc-200 text-xs">
                      Search Apps
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] px-1.5 py-0 h-5 border-white/10 text-zinc-500"
                    >
                      store
                    </Badge>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                </div>

                {/* AI text response */}
                <div className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <ChatMarkdown content="I found **4 apps** matching your search. Here are the top results:\n\n1. **Chess Arena** - Multiplayer chess with ELO ranking\n2. **Tabletop Simulator** - Virtual board games" />
                </div>
              </div>
            </div>

            {/* User follow-up */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-amber-500/20 text-amber-100">
                Tell me more about Chess Arena
              </div>
            </div>

            {/* AI loading */}
            <div className="flex justify-start">
              <div className="rounded-xl px-3 py-2 bg-white/5">
                <TypingIndicatorPulse />
              </div>
            </div>
          </div>
        </ComponentSample>
      </section>

      {/* ── Code Preview ──────────────────────────────────── */}
      <CodePreview
        code={codeSnippets.chatMarkdown}
        title="Usage Examples"
        tabs={[
          { label: "ChatMarkdown", code: codeSnippets.chatMarkdown },
          { label: "JsonView", code: codeSnippets.jsonView },
          { label: "Tool Renderers", code: codeSnippets.toolRenderer },
          { label: "SiteChat", code: codeSnippets.siteChat },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "Chat widget toggle button has descriptive aria-label for screen readers.",
          "Close button includes aria-label='Close chat' for keyboard navigation.",
          "Tool call cards use semantic button elements with collapsible content.",
          "Message list scrolls to latest message for screen reader announcement.",
          "Textarea input supports Enter to send and Shift+Enter for new lines.",
          "Image attachments include alt text for accessibility.",
          "JsonView tree nodes are interactive buttons with expand/collapse semantics.",
          "Loading indicator uses animated dots visible to screen readers via aria-busy.",
          "Typing indicators include aria-label='Agent is typing' for assistive technology.",
          "Threaded replies maintain logical reading order for screen readers.",
        ]}
      />

      <RelatedComponents currentId="chat" />
    </div>
  );
}

/* ── Helper Components ────────────────────────────────────── */

/** Typing indicator with staggered pulse animation. */
function TypingIndicatorPulse() {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label="Agent is typing"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
        style={{ animationDelay: "0.2s" }}
      />
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
        style={{ animationDelay: "0.4s" }}
      />
    </span>
  );
}

/** Typing indicator with bounce animation. */
function TypingIndicatorBounce() {
  return (
    <div
      className="rounded-xl px-4 py-3 bg-white/5 inline-flex"
      aria-label="Agent is typing"
    >
      <span className="inline-flex items-end gap-1 h-4">
        <span
          className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
          style={{ animationDuration: "0.6s" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
          style={{ animationDuration: "0.6s", animationDelay: "0.15s" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
          style={{ animationDuration: "0.6s", animationDelay: "0.3s" }}
        />
      </span>
    </div>
  );
}

/** Typing indicator with wave-like fade animation. */
function TypingIndicatorWave() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => (t + 1) % 3);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-xl px-4 py-3 bg-white/5 inline-flex"
      aria-label="Agent is typing"
    >
      <span className="inline-flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 transition-opacity duration-300"
            style={{ opacity: tick === i ? 1 : 0.25 }}
          />
        ))}
      </span>
    </div>
  );
}

/** Non-functional mockup of a ToolCallCard showing status variations. */
function ToolCallMockup({
  name,
  serverName,
  status,
  label,
}: {
  name: string;
  serverName: string;
  status: "running" | "done" | "error";
  label: string;
}) {
  const statusIcons = {
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />,
    done: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    error: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
  };

  const formatName = (n: string) => n.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Card
      className={status === "error"
        ? "border-red-500/30 bg-red-500/5"
        : "glass-1"}
    >
      <CardContent className="pt-6 space-y-3">
        <Badge variant="outline" className="text-xs">{label}</Badge>
        <div className="rounded-lg border border-white/10 bg-white/5 text-sm">
          <div className="flex items-center gap-2 px-3 py-2">
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
            <Wrench className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-medium text-zinc-200 text-xs truncate">
              {formatName(name)}
            </span>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] px-1.5 py-0 h-5 border-white/10 text-zinc-500"
            >
              {serverName}
            </Badge>
            {statusIcons[status]}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {status === "running" && "Tool is currently executing..."}
          {status === "done" && "Tool completed successfully with results."}
          {status === "error" && "Tool execution failed with an error."}
        </p>
      </CardContent>
    </Card>
  );
}

/** Non-functional visual mockup of the SiteChat open state. */
function SiteChatMockup() {
  const [mockInput, setMockInput] = useState("");

  return (
    <div className="w-full max-w-[380px] flex flex-col rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-white text-sm">
            spike.land Agent
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Wrench className="h-3 w-3" />
            Turn 2/10
          </span>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white cursor-default"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex flex-col gap-2.5 p-3 min-h-[160px]">
        <div className="flex justify-end">
          <div className="rounded-xl px-3 py-1.5 text-xs bg-amber-500/20 text-amber-100">
            What MCP tools are available?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-xl bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
            There are <strong className="text-zinc-100">120 MCP tools</strong>{" "}
            available across categories including search, file operations, code evaluation, and
            more.
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-2.5 bg-zinc-900/50">
        <div className="flex items-end gap-1.5 rounded-[20px] border border-white/10 bg-black/20 p-1.5">
          <div className="flex shrink-0 gap-0.5 pb-0.5 pl-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-zinc-400"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-zinc-400"
            >
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Textarea
            value={mockInput}
            onChange={e => setMockInput(e.target.value)}
            placeholder="Ask anything..."
            className="min-h-[28px] max-h-[80px] flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-xs text-white shadow-none placeholder:text-zinc-500 focus-visible:ring-0"
            rows={1}
          />
          <div className="shrink-0 pb-0.5 pr-0.5">
            <Button
              size="icon"
              disabled={!mockInput.trim()}
              className="h-7 w-7 rounded-full bg-amber-500 text-zinc-950 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
