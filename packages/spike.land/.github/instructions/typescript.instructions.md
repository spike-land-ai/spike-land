---
applyTo: "src/**/*.ts,src/**/*.tsx"
---

# TypeScript Standards

- **Strict mode** is enforced — no `any` types
- Use `unknown` instead of `any` for untyped values
- Use `interface` over `type` for object shapes (types for unions/intersections)
- Add explicit return types on exported functions
- Use `satisfies` operator for type-safe object literals
- Import types with `import type` when only used as types
- Use `@/` path alias for all src/ imports
- Prefer `const` assertions for literal types
- Use discriminated unions for state modeling
- Handle all cases in switch statements (exhaustive checks)
