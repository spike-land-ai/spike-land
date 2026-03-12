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
  "dot-notation": "off",
  "@typescript-eslint/dot-notation": ["error", { allowIndexSignaturePropertyAccess: true }],
  // ── Type-aware rules (require parserOptions.projectService) ─────────────────
  "@typescript-eslint/no-floating-promises": "warn",
  "@typescript-eslint/no-misused-promises": ["warn", { checksVoidReturn: { arguments: false } }],
  "@typescript-eslint/await-thenable": "error",
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
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
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
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
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
  // Test file overrides — disable type-aware rules (test files are excluded
  // from the root tsconfig; they use tsconfig.test.json which is typechecked
  // separately via `yarn typecheck:tests`)
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      ".tests/**/*.ts",
      ".tests/**/*.tsx",
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/await-thenable": "off",
    },
  },
  // Directories excluded from root tsconfig — disable type-aware rules
  // (typechecked via their own tsconfigs separately)
  {
    files: [
      "src/frontend/platform-frontend/**/*.ts",
      "src/frontend/platform-frontend/**/*.tsx",
      "src/frontend/monaco-editor/**/*.ts",
      "src/frontend/monaco-editor/**/*.tsx",
      "src/media/educational-videos/**/*.ts",
      "src/media/educational-videos/**/*.tsx",
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      "@typescript-eslint/dot-notation": "off",
      "dot-notation": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/await-thenable": "off",
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
      // Disable type-aware rules for config files (no projectService)
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/await-thenable": "off",
    },
  },
);
