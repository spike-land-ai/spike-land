---
applyTo: "**/*.test.ts,**/*.test.tsx,e2e/**"
---

# Testing Standards

## Unit Tests (Vitest)

- **100% code coverage required** — check with `yarn test:coverage`
- Co-locate test files alongside source: `Component.tsx` → `Component.test.tsx`
- Use `describe`/`it` blocks with clear descriptions
- Mock external dependencies with `vi.mock()`
- Use `@testing-library/react` for component tests
- Test behavior, not implementation details
- Use `vi.fn()` for function mocks, `vi.spyOn()` for method spies
- Clean up after each test with `afterEach(() => vi.restoreAllMocks())`

## E2E Tests (Playwright + Cucumber)

- Feature files go in `e2e/features/` with `.feature` extension
- Step definitions in `e2e/step-definitions/`
- Use Gherkin syntax: `Given`, `When`, `Then`
- Prefer `getByRole`, `getByText` over CSS selectors
- Use `page.waitForLoadState()` before assertions
- Run with `yarn test:e2e:local` (requires dev server)

## Test Organization

- Group related tests in `describe` blocks
- Use `it.each` for parameterized tests
- Avoid `.skip()` — if skipping, document reason in `docs/SKIPPED_TESTS.md`
