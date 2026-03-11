/**
 * Root ESLint flat config for the spike-land-ai monorepo.
 *
 * Inlines the logic from @spike-land-ai/eslint-config so there is
 * no per-package eslint config needed. The shared config is still
 * published for external consumers via MCP publish tool.
 */
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
// ─── Shared Rules ────────────────────────────────────────────────────────────

const sharedRules = {
  ...tseslint.configs.recommended.reduce((acc, config) => ({ ...acc, ...config.rules }), {}),
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
  // ── Type-safety rules (no type-aware linting required) ──────────────────────
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
      disallowTypeAnnotations: false,
    },
  ],
  "dot-notation": "error",
  // ── Type-aware rules (require parserOptions.project / projectService) ────────
  // These rules are intentionally NOT enabled here because this config has no
  // parserOptions.project set. Enabling them without it either silently no-ops
  // or throws a parser error on every file.
  //
  // To activate them, add parserOptions.projectService: true (or point
  // parserOptions.project to a tsconfig) in each languageOptions block, then
  // uncomment:
  //
  //   "@typescript-eslint/no-floating-promises": "error",
  //   "@typescript-eslint/no-misused-promises": "error",
  //   "@typescript-eslint/consistent-type-exports": "error",
  //   "@typescript-eslint/no-unnecessary-type-assertion": "warn",
  //   "@typescript-eslint/prefer-nullish-coalescing": "warn",
  //   "@typescript-eslint/prefer-optional-chain": "warn",
};

// ─── Config ──────────────────────────────────────────────────────────────────

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "src/**/dist/**",
      "src/**/dist-vite/**",
      "coverage/**",
      ".tsbuildinfo",
      ".wrangler/**",
      "packages/**",
      "src/esbuild-wasm/**",
      "src/monaco-editor/**",
      "src/core/chess/core-logic/prisma.ts",
      "**/*.d.ts",
      ".yarn/**",
      "**/routeTree.gen.ts",
    ],
  },
  // TypeScript files (non-React)
  {
    files: ["src/**/*.ts", ".tests/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: sharedRules,
  },
  // React/TSX files
  {
    files: ["src/**/*.tsx", ".tests/**/*.tsx", "scripts/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...sharedRules,
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  // Test file overrides
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "dot-notation": "off",
    },
  },
  // Config files at root
  {
    files: ["*.config.ts", "*.config.mjs"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...sharedRules,
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
