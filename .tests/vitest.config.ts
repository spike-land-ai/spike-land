import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname, "..");

function src(...segments: string[]) {
  return path.join(root, "src", ...segments);
}

function tests(...segments: string[]) {
  return path.join(root, ".tests", ...segments);
}

const reporter = path.join(root, "vitest-minimal-reporter.ts");

// ── Tier thresholds ────────────────────────────────────────────────
const tier1 = { lines: 90, functions: 90, branches: 90, statements: 90 };
const tier2 = { lines: 60, functions: 55, branches: 50, statements: 60 };
const tier3 = { lines: 40, functions: 35, branches: 30, statements: 40 };

// ── Shared patterns ────────────────────────────────────────────────
const commonCoverageExclude = [
  "**/*.test.ts",
  "**/*.spec.ts",
  "**/__test-utils__/**",
  "vitest.config.ts",
];

const forksPool = {
  pool: "forks" as const,
  fileParallelism: true,
  silent: true,
};

// ── Base aliases (inherited by root-level resolve) ─────────────────
const baseAliases: Record<string, string> = {
  "@spike-land-ai/shared/tool-builder": src("shared/tool-builder/index.ts"),
  "@spike-land-ai/shared": src("shared/index.ts"),
  "@spike-land-ai/block-sdk/storage": src("block-sdk/storage/index.ts"),
  "@spike-land-ai/block-sdk/adapters/d1": src("block-sdk/adapters/d1.ts"),
  "@spike-land-ai/block-sdk/adapters/idb": src("block-sdk/adapters/idb.ts"),
  "@spike-land-ai/block-sdk/react": src("block-sdk/react/index.ts"),
  "@spike-land-ai/block-sdk/mcp": src("block-sdk/mcp/index.ts"),
  "@spike-land-ai/block-sdk": src("block-sdk/index.ts"),
  "@spike-land-ai/block-tasks": src("block-tasks/index.ts"),
  "@spike-land-ai/mcp-server-base": src("mcp-server-base/index.ts"),
};

// ── Per-package config type ────────────────────────────────────────
interface PkgConfig {
  tier: 1 | 2 | 3;
  pool?: "forks";
  env?: "jsdom";
  globals?: boolean;
  setup?: string[];
  includeTests?: string[];
  includeSrc?: string[];
  coverageExclude?: string[];
  coverageReporter?: string[];
  aliases?: Record<string, string>;
  plugins?: Array<Record<string, unknown>>;
  thresholds?: { lines: number; functions: number; branches: number; statements: number };
  provider?: "istanbul";
  reportsDirectory?: string;
  reporters?: string[];
  coverageAll?: boolean;
}

// ── Package registry ───────────────────────────────────────────────
const packages: Record<string, PkgConfig> = {
  "bazdmeg-mcp": { tier: 1, pool: "forks" },

  "block-sdk": {
    tier: 2,
    aliases: {
      "@spike-land-ai/block-sdk/storage": src("block-sdk/storage/index.ts"),
      "@spike-land-ai/block-sdk/adapters/d1": src("block-sdk/adapters/d1.ts"),
      "@spike-land-ai/block-sdk/adapters/idb": src("block-sdk/adapters/idb.ts"),
      "@spike-land-ai/block-sdk/react": src("block-sdk/react/index.ts"),
      "@spike-land-ai/block-sdk/mcp": src("block-sdk/mcp/index.ts"),
      "@spike-land-ai/block-sdk": src("block-sdk/index.ts"),
      "@spike-land-ai/block-tasks": src("block-tasks/index.ts"),
      "@spike-land-ai/shared": src("shared/index.ts"),
      "@spike-land-ai/mcp-server-base": src("mcp-server-base/index.ts"),
    },
    coverageExclude: ["**/adapters/d1.ts", "**/adapters/idb.ts", "**/storage/**"],
    reportsDirectory: path.join(root, "coverage/block-sdk"),
  },

  "block-tasks": {
    tier: 3,
    aliases: {
      "@spike-land-ai/block-sdk/storage": src("block-sdk/storage/index.ts"),
      "@spike-land-ai/block-sdk": src("block-sdk/index.ts"),
      "@spike-land-ai/block-tasks": src("block-tasks/index.ts"),
      "@spike-land-ai/shared/tool-builder": src("shared/tool-builder/index.ts"),
      "@spike-land-ai/shared": src("shared/index.ts"),
      "@spike-land-ai/mcp-server-base": src("mcp-server-base/index.ts"),
    },
    coverageExclude: ["**/browser.ts", "**/worker.ts"],
    reportsDirectory: path.join(root, "coverage/block-tasks"),
  },

  "block-website": {
    tier: 3,
    env: "jsdom",
    includeTests: [tests("block-website/**/*.test.ts"), tests("block-website/**/*.test.tsx")],
    aliases: {
      "react": src("react-ts-worker/react/index.ts"),
      "react-dom": src("react-ts-worker/react-dom/client.ts"),
    },
    includeSrc: [
      src("block-website/src/core/**/*.ts"),
      src("block-website/src/lib/**/*.ts"),
      src("block-website/src/ui/hooks/**/*.ts"),
    ],
    coverageExclude: ["**/types.ts"],
  },

  "chess-engine": {
    tier: 2,
    aliases: { "@/": src("chess-engine/") },
    coverageExclude: ["**/generated/**", "**/lib/prisma.ts"],
    coverageAll: true,
    reportsDirectory: path.join(root, "coverage/chess-engine"),
  },

  "code": {
    tier: 3,
    env: "jsdom",
    globals: true,
    setup: [tests("code/setupTests.ts")],
    includeTests: [tests("code/**/*.test.ts"), tests("code/**/*.spec.ts"), tests("code/**/*.spec.tsx")],
    aliases: { "@": src("code/@") },
    includeSrc: [src("code/**/*.ts"), src("code/**/*.tsx")],
    coverageExclude: [],
    reportsDirectory: path.join(root, "coverage/code"),
  },

  "esm-cdn": {
    tier: 3,
    includeTests: [src("esm-cdn/**/*.spec.ts")],
    coverageExclude: [],
  },
  "esbuild-wasm-mcp": { tier: 2, pool: "forks" },
  "google-analytics-mcp": { tier: 2, pool: "forks" },
  "google-ads-mcp": { tier: 2, pool: "forks" },
  "hackernews-mcp": { tier: 2, pool: "forks" },

  "image-studio-worker": {
    tier: 2,
    coverageExclude: [
      "**/frontend/**",
      "**/migrations/**",
      "**/deps/nanoid.ts",
      "**/deps/db.ts",
      "**/deps/generation.ts",
      "**/server.ts",
      "**/agent/chat-handler.ts",
      "**/tool-registry.ts",
      "**/env.d.ts",
      "**/shared-types.ts",
    ],
  },

  "incremental-test-mcp": { tier: 3, coverageExclude: [] },

  "mcp-auth": {
    tier: 1,
    thresholds: { lines: 100, functions: 100, branches: 95, statements: 100 },
    coverageExclude: [],
  },

  "mcp-image-studio": {
    tier: 2,
    pool: "forks",
    aliases: baseAliases,
    coverageExclude: ["**/generated/**", "**/cli-server.ts"],
  },

  "mcp-server-base": { tier: 3, coverageExclude: [] },

  "openclaw-mcp": {
    tier: 1,
    thresholds: { lines: 95, functions: 85, branches: 96, statements: 95 },
    coverageReporter: ["text-summary"],
    coverageExclude: ["**/types.ts", "**/*.d.ts"],
  },

  "qa-studio": { tier: 2, pool: "forks" },

  "react-ts-worker": {
    tier: 3,
    env: "jsdom",
    aliases: {
      "react-ts-worker/react": src("react-ts-worker/react/index.ts"),
      "react-ts-worker/react-dom/client": src("react-ts-worker/react-dom/client.ts"),
      "react-ts-worker/react-dom/server": src("react-ts-worker/react-dom/server.ts"),
    },
    includeTests: [tests("react-ts-worker/**/*.test.ts"), tests("react-ts-worker/**/*.test.tsx")],
    includeSrc: [src("react-ts-worker/**/*.ts"), src("react-ts-worker/**/*.tsx")],
    coverageExclude: [],
  },

  "shared": {
    tier: 2,
    aliases: {
      "@spike-land-ai/shared/tool-builder": src("shared/tool-builder/index.ts"),
      "@spike-land-ai/shared": src("shared/index.ts"),
    },
    coverageReporter: ["text", "text-summary"],
    includeSrc: [
      src("shared/constants/**/*.ts"),
      src("shared/validations/**/*.ts"),
      src("shared/utils/**/*.ts"),
      src("shared/tool-builder/**/*.ts"),
    ],
    coverageExclude: ["**/types/**", "**/tsup.config.ts", "**/tool-builder/types.ts"],
  },

  "spike-app": {
    tier: 3,
    env: "jsdom",
    setup: [tests("spike-app/test-setup.ts")],
    aliases: { "@": src("spike-app") },
    includeTests: [tests("spike-app/**/*.test.ts"), tests("spike-app/**/*.test.tsx")],
    includeSrc: [src("spike-app/**/*.ts"), src("spike-app/**/*.tsx")],
    coverageExclude: [],
  },

  "spike-cli": {
    tier: 2,
    coverageReporter: ["text"],
    coverageExclude: ["**/dist/**", "**/cli.ts", "**/*.d.ts"],
  },

  "spike-edge": {
    tier: 2,
    aliases: { "cloudflare:workers": src("spike-edge/__mocks__/cloudflare-workers.ts") },
    coverageExclude: [],
  },

  "spike-land-backend": {
    tier: 3,
    provider: "istanbul",
    setup: [tests("spike-land-backend/vitest.setup.ts")],
    plugins: [
      {
        name: "html-string-loader",
        enforce: "pre",
        transform(code: string, id: string) {
          if (id.endsWith(".html")) {
            return { code: `export default ${JSON.stringify(code)};`, map: null };
          }
        },
      },
    ],
    aliases: {
      "replicate": src("spike-land-backend/__mocks__/replicate.js"),
      "snakecase-keys": src("spike-land-backend/__mocks__/snakecase-keys.js"),
      "cookie": src("spike-land-backend/__mocks__/cookie.js"),
      "@spike-land-ai/code": src("spike-land-backend/__mocks__/@spike-land-ai/code.js"),
      "@spike-land-ai/esbuild-wasm": path.join(root, "node_modules/@spike-land-ai/esbuild-wasm"),
    },
    reporters: process.env["COVERAGE"]
      ? [reporter]
      : ["hanging-process", reporter],
    includeTests: [tests("spike-land-backend/**/*.test.ts"), tests("spike-land-backend/**/*.spec.ts")],
    coverageReporter: ["text-summary"],
    coverageExclude: ["**/*.d.ts", "**/frontend/**", "**/staticContent.mjs", "**/*.html", "**/*.wasm", "**/esbuild-defs.ts"],
  },

  "spike-land-mcp": {
    tier: 2,
    aliases: {
      "@spike-land-ai/shared/tool-builder": src("shared/tool-builder/index.ts"),
      "@spike-land-ai/shared": src("shared/index.ts"),
      "@spike-land-ai/mcp-server-base": src("mcp-server-base/index.ts"),
    },
    includeSrc: [
      src("spike-land-mcp/auth/**/*.ts"),
      src("spike-land-mcp/db/**/*.ts"),
      src("spike-land-mcp/kv/**/*.ts"),
      src("spike-land-mcp/lib/**/*.ts"),
      src("spike-land-mcp/mcp/**/*.ts"),
      src("spike-land-mcp/middleware/**/*.ts"),
      src("spike-land-mcp/procedures/**/*.ts"),
      src("spike-land-mcp/routes/**/*.ts"),
      src("spike-land-mcp/tools/tool-helpers.ts"),
      src("spike-land-mcp/tools/tool-factory.ts"),
      src("spike-land-mcp/tools/types.ts"),
      src("spike-land-mcp/app.ts"),
      src("spike-land-mcp/env.ts"),
    ],
    coverageExclude: [],
  },

  "spike-review": {
    tier: 2,
    coverageExclude: ["**/cli.ts", "**/worker/**", "**/spike-review/worker/**"],
  },

  "stripe-analytics-mcp": { tier: 2, pool: "forks" },

  "state-machine": {
    tier: 2,
    coverageExclude: ["**/cli.ts", "**/types.ts", "**/prisma.d.ts"],
  },

  "transpile": {
    tier: 3,
    plugins: [
      {
        name: "wasm-stub",
        enforce: "pre",
        load(id: string) {
          if (id.endsWith(".wasm")) {
            return `export default "https://mock.wasm.url/esbuild.wasm";`;
          }
        },
      },
    ],
    includeTests: [tests("transpile/**/*.test.ts"), tests("transpile/**/*.spec.ts")],
    coverageExclude: ["**/*.d.ts"],
  },

  "vibe-dev": {
    tier: 2,
    coverageExclude: ["**/cli.ts"],
  },

  "video": {
    tier: 3,
    env: "jsdom",
    pool: "forks",
    setup: [tests("video/setup.ts")],
    includeTests: [tests("video/**/*.test.ts"), tests("video/**/*.test.tsx")],
    includeSrc: [src("video/**/*.ts"), src("video/**/*.tsx")],
  },
};

// ── Project generator ──────────────────────────────────────────────
function buildProject(name: string, cfg: PkgConfig) {
  const tierThresholds = cfg.tier === 1 ? tier1 : cfg.tier === 2 ? tier2 : tier3;
  const thresholds = cfg.thresholds ?? tierThresholds;

  const defaultIncludeTests = [tests(`${name}/**/*.test.ts`)];
  const defaultIncludeSrc = [src(`${name}/**/*.ts`)];
  const defaultCoverageExclude = [...commonCoverageExclude, "**/index.ts"];

  const coverageExclude = cfg.coverageExclude !== undefined && cfg.coverageExclude.length === 0
    ? commonCoverageExclude
    : [...commonCoverageExclude, "**/index.ts", ...(cfg.coverageExclude ?? [])];

  const testConfig: Record<string, unknown> = {
    name,
    include: cfg.includeTests ?? defaultIncludeTests,
    reporters: cfg.reporters ?? [reporter],
    coverage: {
      provider: cfg.provider ?? "v8",
      ...(cfg.coverageReporter ? { reporter: cfg.coverageReporter } : {}),
      ...(cfg.coverageAll ? { all: true } : {}),
      include: cfg.includeSrc ?? defaultIncludeSrc,
      exclude: coverageExclude,
      ...(cfg.reportsDirectory ? { reportsDirectory: cfg.reportsDirectory } : {}),
      thresholds,
    },
  };

  if (cfg.pool === "forks") Object.assign(testConfig, forksPool);
  if (cfg.env) testConfig.environment = cfg.env;
  if (cfg.globals) testConfig.globals = true;
  if (cfg.setup) testConfig.setupFiles = cfg.setup;

  const project: Record<string, unknown> = { test: testConfig };
  if (cfg.aliases) project.resolve = { alias: cfg.aliases };
  if (cfg.plugins) project.plugins = cfg.plugins;

  return project;
}

// ── Build all projects ─────────────────────────────────────────────
const projects = Object.entries(packages).map(([name, cfg]) => buildProject(name, cfg));

export default defineConfig({
  resolve: { alias: baseAliases },
  test: {
    reporters: [reporter],
    coverage: {
      exclude: [
        // spike-land-backend: CF Workers runtime paths not exercisable in Node
        src("spike-land-backend/types/cloudflare.ts"),
        src("spike-land-backend/chatRoom.ts"),
        src("spike-land-backend/chat.ts"),
        src("spike-land-backend/anthropicHandler.ts"),
        src("spike-land-backend/websocketHandler.ts"),
        src("spike-land-backend/handlers/postHandler.ts"),
        src("spike-land-backend/mcp/handler.ts"),
        src("spike-land-backend/routes/apiRoutes.ts"),
        src("spike-land-backend/replicateHandler.ts"),
        src("spike-land-backend/Logs.ts"),
        src("spike-land-backend/fetchHandler.ts"),
        src("spike-land-backend/mainFetchHandler.ts"),
        src("spike-land-backend/mcp/tools/edit-tools.ts"),
        src("spike-land-backend/mcp/tools/find-tools.ts"),
        src("spike-land-backend/utils/jsonSchemaToZod.ts"),
        // Monaco DOM-only files
        src("code/@/lib/ws.ts"),
        src("code/@/lib/shared-w-polyfill.ts"),
        src("code/@/lib/code-session.ts"),
        src("code/@/services/editorUtils.ts"),
      ],
    },
    projects,
  },
});
