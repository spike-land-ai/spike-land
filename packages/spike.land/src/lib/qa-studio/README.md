# QA Studio Library

Headless browser automation layer for the QA Studio app. Available in
development mode only and restricted to admin/super-admin users.

## Key Files

| File                 | Responsibility                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`           | Result types returned by all QA actions: `QaNavigateResult`, `QaScreenshotResult`, `QaConsoleMessage`, `QaNetworkResult`, `QaEvaluateResult`, `QaAccessibilityResult`, `QaCoverageResult`, `QaTabInfo`, `QaTestResult`, `QaActionError` |
| `browser-session.ts` | Singleton `BrowserSession` wrapping a headless Chromium instance via Playwright. Lazy-launched on first use, auto-closed after 5 minutes of idle. Manages a multi-tab `Map<index, TabEntry>`                                            |
| `actions.ts`         | Next.js Server Actions that gate on `auth()` (admin role) + `NODE_ENV === "development"`, then delegate to `browser-session`                                                                                                            |

## Architecture

```
actions.ts          (Next.js "use server" — auth + dev guard)
  └── browser-session.ts  (Playwright singleton, multi-tab manager)
      types.ts            (shared result interfaces)
```

`actions.ts` exports individual async functions (`qaNavigate`, `qaScreenshot`,
`qaEvaluate`, `qaGetConsole`, `qaGetNetwork`, `qaGetAccessibility`, etc.) that
the QA Studio UI calls directly as server actions.

`browser-session.ts` is imported dynamically inside each action to avoid
Playwright being bundled in production builds.

## MCP Exposure

QA tools are also exposed over MCP for AI-driven testing:

- `src/lib/mcp/server/tools/qa/` — MCP tool wrappers around the same
  `actions.ts` functions
- `packages/store-apps/qa-studio/tools.ts` — standalone store app variant

## Constraints

- Dev-only: all actions throw if `NODE_ENV !== "development"`
- Admin-only: all actions call `auth()` and check `UserRole.ADMIN | SUPER_ADMIN`
- Playwright is a peer dependency; not bundled in production
